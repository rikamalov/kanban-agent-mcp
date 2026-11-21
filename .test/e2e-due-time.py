#!/usr/bin/env python3
"""E2E срока с временем (v10) на живом сервере, чистые данные.

Запуск: KANBAN_PORT=3197 KANBAN_DATA=<пустой каталог> KANBAN_INSECURE_COOKIE=1 node server.js &
        python3 .test/e2e-due-time.py http://127.0.0.1:3197
"""
import json
import sys
import urllib.error
import urllib.request
from http.cookiejar import CookieJar

BASE = (sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:3197').rstrip('/')

jar = CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))

ok_n = 0
fail = []


def call(method, path, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method,
                                 headers={'Content-Type': 'application/json'})
    try:
        with opener.open(req) as r:
            body = r.read().decode()
            return r.status, (json.loads(body) if body else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'raw': raw}


def ok(cond, name):
    global ok_n
    if cond:
        ok_n += 1
    else:
        fail.append(name)
        print('  ✗ ' + name)


st, _ = call('POST', '/api/setup', {'username': 'admin', 'password': 'Test-Pass-123'})
ok(st in (200, 201, 409), 'setup: %s' % st)
st, _ = call('POST', '/api/login', {'username': 'admin', 'password': 'Test-Pass-123'})
ok(st == 200, 'login: %s' % st)

st, stages = call('GET', '/api/stages')
sid = (stages[0]['id'] if isinstance(stages, list) and stages else 'DISCUSSION')
print('stages:', st, len(stages) if isinstance(stages, list) else stages)

# 1. создание со временем
st, t = call('POST', '/api/tasks', {'title': 'Со временем', 'stage': sid, 'due_at': '2026-10-20T14:30'})
ok(st == 200, 'create со временем: %s %s' % (st, t if st != 200 else ''))
tid = t.get('id')
ok(t.get('due_at') == '2026-10-20T14:30', 'create вернул due_at с временем, получено %r' % t.get('due_at'))

# 2. чтение списка
st, lst = call('GET', '/api/tasks')
tasks = lst.get('tasks') if isinstance(lst, dict) else lst
if not isinstance(tasks, list):
    tasks = []
row = next((x for x in tasks if isinstance(x, dict) and x.get('id') == tid), None)
ok(bool(row) and row.get('due_at') == '2026-10-20T14:30', 'GET /api/tasks отдал время как есть')

# 3. PATCH только времени/даты
st, t2 = call('PATCH', '/api/tasks/%s' % tid, {'due_at': '2026-10-21T09:05'})
ok(t2.get('due_at') == '2026-10-21T09:05', 'PATCH меняет дату+время, получено %r' % t2.get('due_at'))

# 4. PATCH другого поля не трогает срок
st, t3 = call('PATCH', '/api/tasks/%s' % tid, {'title': 'Переименовано'})
ok(t3.get('due_at') == '2026-10-21T09:05', 'PATCH title не сбросил время')

# 5. снятие срока
st, t4 = call('PATCH', '/api/tasks/%s' % tid, {'due_at': None})
ok(t4.get('due_at') is None, 'PATCH due_at=null очищает срок')

# 6. «только дата» остаётся датой
st, t5 = call('PATCH', '/api/tasks/%s' % tid, {'due_at': '2026-10-22'})
ok(t5.get('due_at') == '2026-10-22', 'срок без времени хранится как дата')

# 7. календарь/DnD-совместимость: дата в локальной зоне не съезжает
st, t6 = call('PATCH', '/api/tasks/%s' % tid, {'due_at': '2026-10-23T23:30'})
ok(t6.get('due_at') == '2026-10-23T23:30', 'позднее время (23:30) сохраняется без сдвига даты')

# 8. MCP-путь: токен + kanban_create_task с временем
st, tok = call('POST', '/api/tokens', {'name': 'e2e', 'scopes': 'write'})
token = tok.get('token')
ok(bool(token), 'токен для MCP создан')
if token:
    payload = {'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call',
               'params': {'name': 'kanban_create_task',
                          'arguments': {'title': 'MCP со временем', 'due_at': '2026-11-02T08:15'}}}
    req = urllib.request.Request(BASE + '/mcp', data=json.dumps(payload).encode(), method='POST',
                                 headers={'Content-Type': 'application/json',
                                          'Accept': 'application/json, text/event-stream',
                                          'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req) as r:
        raw = r.read().decode()
    raw = raw.split('data: ', 1)[1] if raw.startswith('data: ') else raw
    res = json.loads(raw)
    content = res.get('result', {}).get('content') or []
    text = content[0]['text'] if content else '{}'
    mcp_task = json.loads(text)
    ok(mcp_task.get('due_at') == '2026-11-02T08:15',
       'MCP kanban_create_task сохранил время, получено %r' % mcp_task.get('due_at'))

print('\nE2E: %d OK, %d FAIL' % (ok_n, len(fail)))
sys.exit(1 if fail else 0)
