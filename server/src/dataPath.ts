import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the data directory path.
// In production/packaged mode, the path is provided by the main Electron process
// via an environment variable. In development, it's a local folder.
const userDataPath = process.env.KJ_NOMAD_USER_DATA_PATH;

const DATA_DIR = userDataPath
  ? path.join(userDataPath, 'data')
  : path.join(__dirname, '..', 'data');

export const getDataPath = (fileName: string) => {
  return path.join(DATA_DIR, fileName);
};

export const ensureDataDirExists = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

export const getMediaDefaultPath = () => {
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  return path.join(homeDir, 'Music', 'KJ-Nomad');
};
