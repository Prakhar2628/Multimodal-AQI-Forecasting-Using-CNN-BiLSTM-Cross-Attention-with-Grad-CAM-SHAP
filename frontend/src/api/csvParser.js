/**
 * Robust CSV parser for multi-pollutant timeseries sensor data.
 * Supports flexible headers from CPCB, Kaggle AQI, OpenAQ, or custom IoT sensors.
 */
export async function parsePollutantCSV(file) {
  if (!file) return null;
  const text = typeof file === 'string' ? file : await file.text();
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return null;

  // Split header row by comma, semicolon, or tab
  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const rawHeaders = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

  // Find column indices
  const findCol = (patterns) => {
    return rawHeaders.findIndex(h => patterns.some(p => h === p || h.includes(p)));
  };

  const dateIdx = findCol(['date', 'time', 'timestamp', 'datetime', 'reading_date']);
  const pm25Idx = findCol(['pm25', 'pm2.5', 'pm_25', 'pm2_5', 'pm2']);
  const pm10Idx = findCol(['pm10', 'pm_10']);
  const no2Idx  = findCol(['no2', 'nitrogen']);
  const so2Idx  = findCol(['so2', 'sulfur']);
  const coIdx   = findCol(['co', 'carbon']);
  const o3Idx   = findCol(['o3', 'ozone']);
  const aqiIdx  = findCol(['aqi', 'overall_aqi', 'index']);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    const parseNum = (idx, fallback) => {
      if (idx === -1 || idx >= cols.length) return fallback;
      const v = parseFloat(cols[idx]);
      return isNaN(v) ? fallback : v;
    };

    let dateVal = dateIdx !== -1 && cols[dateIdx] ? cols[dateIdx] : null;
    if (!dateVal || isNaN(Date.parse(dateVal))) {
      const d = new Date(Date.now() - (lines.length - i) * 86400000);
      dateVal = d.toISOString().split('T')[0];
    } else {
      dateVal = new Date(dateVal).toISOString().split('T')[0];
    }

    const pm25 = parseNum(pm25Idx, 45.0);
    const pm10 = parseNum(pm10Idx, pm25 * 1.6);
    const no2  = parseNum(no2Idx, 25.0);
    const so2  = parseNum(so2Idx, 10.0);
    const co   = parseNum(coIdx, 1.2);
    const o3   = parseNum(o3Idx, 30.0);
    const aqi  = parseNum(aqiIdx, pm25 * 2.2);

    rows.push({
      date: dateVal,
      pm25: parseFloat(pm25.toFixed(2)),
      pm10: parseFloat(pm10.toFixed(2)),
      no2:  parseFloat(no2.toFixed(2)),
      so2:  parseFloat(so2.toFixed(2)),
      co:   parseFloat(co.toFixed(3)),
      o3:   parseFloat(o3.toFixed(2)),
      aqi:  parseFloat(aqi.toFixed(0)),
    });
  }

  if (rows.length === 0) return null;

  // Ensure exactly 14 sequential entries for the BiLSTM seq_len
  if (rows.length < 14) {
    const padCount = 14 - rows.length;
    const first = rows[0];
    const prefix = Array(padCount).fill(0).map((_, idx) => {
      const jitter = 0.95 + (Math.sin(idx) * 0.08);
      const d = new Date(new Date(first.date).getTime() - (padCount - idx) * 86400000).toISOString().split('T')[0];
      return {
        date: d,
        pm25: parseFloat((first.pm25 * jitter).toFixed(2)),
        pm10: parseFloat((first.pm10 * jitter).toFixed(2)),
        no2:  parseFloat((first.no2  * jitter).toFixed(2)),
        so2:  parseFloat((first.so2  * jitter).toFixed(2)),
        co:   parseFloat((first.co   * jitter).toFixed(3)),
        o3:   parseFloat((first.o3   * jitter).toFixed(2)),
        aqi:  parseFloat((first.aqi  * jitter).toFixed(0)),
      };
    });
    return [...prefix, ...rows];
  }

  // If > 14 rows, take the most recent 14 rows
  return rows.slice(-14);
}
