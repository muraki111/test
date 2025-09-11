import sys
import requests
import re
import os

# スプレッドシートURLは第1引数
if len(sys.argv) < 2:
    print("Usage: python update_csvs_from_sheets.py <SPREADSHEET_URL>")
    sys.exit(1)

url = sys.argv[1].strip()
match = re.search(r'/d/([a-zA-Z0-9-_]+)', url)
if not match:
    raise ValueError('Invalid spreadsheet URL')
spreadsheet_id = match.group(1)

# Google Sheets APIで全シート名とgidを取得
sheets_api_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/gviz/tq?tqx=out:json'
resp = requests.get(sheets_api_url)
resp.raise_for_status()
json_text = resp.text[resp.text.find('{'):-2]  # 先頭のコメントを除去
import json
sheets_info = json.loads(json_text)
sheets = sheets_info['table']['cols']

# シート名とgidの一覧を取得
import re
sheet_gids = {}
for entry in sheets_info['table']['cols']:
    label = entry.get('label')
    if label:
        # gidは0から始まる連番
        sheet_gids[label] = entry.get('id', None)

# workspace内のcsvファイル一覧
csv_files = [f for f in os.listdir('.') if f.endswith('.csv')]

# 既存csvファイル名リスト（拡張子除去）
csv_names = [os.path.splitext(f)[0] for f in csv_files]

# シート名一覧
sheet_names = list(sheet_gids.keys())

print("csv_files:", csv_files)
print("csv_names:", csv_names)
print("sheet_names:", sheet_names)
# 既存csvと同名のシートがあれば上書き、なければスキップ
for csv_name, csv_file in zip(csv_names, csv_files):
    if csv_name in sheet_gids:
        gid = sheet_gids[csv_name] or '0'
        csv_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}'
        r = requests.get(csv_url)
        r.raise_for_status()
        new_content = r.text
        try:
            with open(csv_file, 'r', encoding='utf-8') as f:
                old_content = f.read()
        except FileNotFoundError:
            old_content = None
        if old_content != new_content:
            print(f"Updating {csv_file} (content changed)")
            with open(csv_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
        else:
            print(f"Skipping {csv_file} (no change)")

# シート名でcsvが存在しない場合は新規作成
for sheet_name in sheet_names:
    csv_file = f'{sheet_name}.csv'
    if csv_file not in csv_files:
        gid = sheet_gids[sheet_name] or '0'
        csv_url = f'https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}'
        r = requests.get(csv_url)
        r.raise_for_status()
        print(f"Creating {csv_file}")
        with open(csv_file, 'w', encoding='utf-8') as f:
            f.write(r.text)
