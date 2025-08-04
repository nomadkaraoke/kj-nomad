import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const isPackaged = app ? app.isPackaged : process.env.NODE_ENV === 'production';

const DATA_DIR = isPackaged
  ? path.join(app.getPath('userData'), 'data')
  : path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const getDataPath = (fileName: string) => {
  return path.join(DATA_DIR, fileName);
};

export const ensureDataDirExists = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};
