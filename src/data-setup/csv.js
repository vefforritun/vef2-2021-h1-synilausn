import { createObjectCsvWriter } from 'csv-writer';

function strip(field) {
  if (typeof field === 'string') {
    return field.replace(/\r/g, '').replace(/\n/g, '\\n');
  }

  return field;
}

export async function writeCsv(data, filename) {
  const keys = Object.keys(data[0]);

  const header = keys.map((key) => ({ id: key, title: key }));

  const csvWriter = createObjectCsvWriter({
    path: filename,
    header,
  });

  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      // eslint-disable-next-line no-param-reassign
      row[key] = strip(row[key]);
    });
  });

  await csvWriter.writeRecords(data);
}
