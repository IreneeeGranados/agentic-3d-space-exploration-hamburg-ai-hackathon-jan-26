"""
Step 0: Download NASA Exoplanet Data
Downloads the latest exoplanet data from NASA Exoplanet Archive
"""

import os
import subprocess
import sys
from datetime import datetime

NASA_API_URL = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+*+from+pscomppars&format=csv"
OUTPUT_FILE = "nasa_data/nasa_data.csv"
BACKUP_FILE = "nasa_data/nasa_data.csv.backup"

def download_nasa_data():
    """Download latest NASA exoplanet data from official API."""
    print(f"🌍 Downloading NASA Exoplanet Data")
    print(f"Source: NASA Exoplanet Archive")
    print(f"URL: {NASA_API_URL}")
    print(f"Output: {OUTPUT_FILE}\n")
    
    # Create backup if file exists
    if os.path.exists(OUTPUT_FILE):
        print(f"📦 Creating backup: {BACKUP_FILE}")
        if os.path.exists(BACKUP_FILE):
            os.remove(BACKUP_FILE)
        os.rename(OUTPUT_FILE, BACKUP_FILE)
    
    # Download data
    print(f"⬇️  Downloading data...")
    try:
        result = subprocess.run(
            ['curl', '-o', OUTPUT_FILE, NASA_API_URL],
            check=True,
            capture_output=True,
            text=True
        )
        
        # Verify download
        if os.path.exists(OUTPUT_FILE):
            size = os.path.getsize(OUTPUT_FILE)
            with open(OUTPUT_FILE, 'r') as f:
                lines = sum(1 for _ in f)
            
            print(f"✅ Download complete!")
            print(f"   Size: {size / (1024*1024):.2f} MB")
            print(f"   Rows: {lines:,}")
            print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            return True
        else:
            print(f"❌ Download failed: Output file not created")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Download failed: {e}")
        if os.path.exists(BACKUP_FILE):
            print(f"♻️  Restoring backup...")
            os.rename(BACKUP_FILE, OUTPUT_FILE)
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        if os.path.exists(BACKUP_FILE):
            print(f"♻️  Restoring backup...")
            os.rename(BACKUP_FILE, OUTPUT_FILE)
        return False

if __name__ == "__main__":
    success = download_nasa_data()
    sys.exit(0 if success else 1)
