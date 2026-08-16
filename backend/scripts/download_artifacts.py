import gdown
import os
import sys

def download_artifacts():
    file_ids = [
        '1gQcIIBMpmiBwwE-lS19QRxOGVngVDnN7',
        '1ODqVCX7T86LdYPZumoKnTaA0ZV1jJzR9',
        '16PGKqrc0-RYqyyR07wV7Ro7EUI3vLdUk',
        '1fWPhvA20IXj5rczm4OKvtvJcFDBPmDep',
        '1ZftekrN7fMAMXWQUcbD53PBA1rvd6M1v',
        '1p8n83q9lvjzawFi1jbU9IyIbLqCR8ppk',
        '1_Q2fH1tUL4Fo-FBzWX97oF6Iyn87syUw',
        '1MoGCyQoRNW5-M4yh9oXlvwc7uSOJxoNP',
        '1QLi8JeKi6-HN9ga_R-rHBiK4837uGCSJ',
        '1Ji_5nX1nJ-H2oavFLf2fNC9e2nDnKzQE',
        '1jShicBqSz4u4Yfha_bdWNES32ZfPHIkR'
    ]
    
    target_dir = os.path.join('app', 'ml_artifacts')
    os.makedirs(target_dir, exist_ok=True)
    
    print(f"Downloading {len(file_ids)} files to {target_dir}...")
    
    for file_id in file_ids:
        url = f'https://drive.google.com/uc?id={file_id}'
        try:
            print(f"Downloading {file_id}...")
            gdown.download(url=url, output=target_dir + '/', quiet=False)
        except Exception as e:
            print(f"Error downloading {file_id}: {e}")

if __name__ == '__main__':
    download_artifacts()
