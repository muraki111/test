import os
import sys
import tempfile
import gspread
from google.oauth2.service_account import Credentials
import pandas as pd
import json

def main():
    if len(sys.argv) < 3:
        print("Usage: python update_csvs_from_sheets.py <GSHEET_URL> <GSHEET_CREDENTIALS_JSON>")
        sys.exit(1)

    GSHEET_URL = sys.argv[1]
    GSHEET_CREDENTIALS_JSON = sys.argv[2]

    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json') as tmp:
        # 文字列がJSONとして正しいか確認
        json_obj = json.loads(GSHEET_CREDENTIALS_JSON)
        tmp.write(json.dumps(json_obj))
        tmp_path = tmp.name

    try:
        scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
        creds = Credentials.from_service_account_file(tmp_path, scopes=scopes)
        gc = gspread.authorize(creds)

        sh = gc.open_by_url(GSHEET_URL)

        for worksheet in sh.worksheets():
            sheet_name = worksheet.title
            data = worksheet.get_all_values()
            df = pd.DataFrame(data)
            csv_path = os.path.join(os.path.dirname(__file__), f'../{sheet_name}.csv')
            df.to_csv(csv_path, index=False, header=False)
    finally:
        os.remove(tmp_path)

if __name__ == '__main__':
    main()
