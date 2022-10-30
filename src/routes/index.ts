import { Request, Response, Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { exec, execSync } from 'child_process';

import {
  API_VERSION,
  BUILD_INFO_PATH,
  configureOnBoot,
  WEBSERVER_LOG_PATH,
} from '../config';
import recordingsRouter from './recordings';
import gpsRouter from './gps';
import imuRouter from './imu';
import loraRouter from './lora';
import uploadRouter from './upload';
import otaRouter from './ota';
import networkRouter from './network';
import configRouter from './config';
import kpiRouter from './kpi';
import framekmRouter from './framekm';
import utilRouter from './util';
import previewRouter from './preview';
import { setMostRecentPing } from 'services/heartBeat';
import { getLockTime } from 'util/lock';
import { getSessionId } from 'util/index';
import { getCurrentLEDs } from 'util/led';
import { getDeviceInfo } from 'services/deviceInfo';

const router = Router();

router.use('/api/1', router);
router.use('/recordings', recordingsRouter);
router.use('/gps', gpsRouter);
router.use('/imu', imuRouter);
router.use('/lora', loraRouter);
router.use('/upload', uploadRouter);
router.use('/ota', otaRouter);
router.use('/network', networkRouter);
router.use('/config', configRouter);
router.use('/kpi', kpiRouter);
router.use('/framekm', framekmRouter);
router.use('/util', utilRouter);
router.use('/preview', previewRouter);

router.get('/init', configureOnBoot);

router.get('/info', async (req: Request, res: Response) => {
  let versionInfo = {};
  setMostRecentPing(Date.now());
  try {
    const versionInfoPayload = readFileSync(BUILD_INFO_PATH, {
      encoding: 'utf-8',
    });
    versionInfo = JSON.parse(versionInfoPayload);
  } catch (error) {
    console.log('Build Info file is missing');
  }
  const deviceInfo = getDeviceInfo();
  res.json({
    ...versionInfo,
    ...deviceInfo,
    api_version: API_VERSION,
  });
});

router.get('/ping', (req, res) => {
  setMostRecentPing(Date.now());
  res.json({
    healthy: true,
    cameraTime: Date.now(),
    leds: getCurrentLEDs(),
    sessionId: getSessionId(),
    ...getLockTime(),
  });
});

router.get('/locktime', (req, res) => {
  res.json(getLockTime());
});

router.get('/time', (req, res) => {
  res.json(Date.now());
});

router.get('/log', async (req: Request, res: Response) => {
  let log = '';
  try {
    log = readFileSync(WEBSERVER_LOG_PATH, {
      encoding: 'utf-8',
    });
    if (log) {
      writeFileSync(WEBSERVER_LOG_PATH, '', {
        encoding: 'utf-8',
      });
    }
  } catch (error) {
    console.log('Webserver Log file is missing');
  }
  res.json({
    log,
  });
});

router.post('/cmd', async (req, res) => {
  try {
    exec(
      req.body.cmd,
      {
        encoding: 'utf-8',
      },
      (error, stdout, stderr) => {
        if (error) {
          console.log(error);
          res.json({ error: stdout || stderr });
        } else {
          console.log(stdout);
          res.json({
            output: stdout,
          });
        }
      },
    );
  } catch (error: unknown) {
    res.json({ error });
  }
});

router.post('/cmd/sync', async (req, res) => {
  try {
    const output = execSync(req.body.cmd, {
      encoding: 'utf-8',
    });
    console.log(output);
    res.json({
      output,
    });
  } catch (error: unknown) {
    res.json({ error });
  }
});

export default router;
