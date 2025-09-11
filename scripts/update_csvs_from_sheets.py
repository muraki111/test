import os
import sys
import gspread
from google.oauth2.service_account import Credentials
import pandas as pd

def main():
    if len(sys.argv) < 3:
        print("Usage: python update_csvs_from_sheets.py <GSHEET_URL> <GSHEET_CREDENTIALS_JSON_PATH>")
        sys.exit(1)

    GSHEET_URL = sys.argv[1]
    GSHEET_CREDENTIALS_JSON_PATH = sys.argv[2]

    scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly']
    creds = Credentials.from_service_account_file(GSHEET_CREDENTIALS_JSON_PATH, scopes=scopes)
    gc = gspread.authorize(creds)

    sh = gc.open_by_url(GSHEET_URL)

    for worksheet in sh.worksheets():
        sheet_name = worksheet.title
        data = worksheet.get_all_values()
        df = pd.DataFrame(data)
        csv_path = os.path.join(os.path.dirname(__file__), f'../{sheet_name}.csv')
        df.to_csv(csv_path, index=False, header=False)

if __name__ == '__main__':
    main()
