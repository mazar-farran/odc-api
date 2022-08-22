import { exec, execSync, ExecException } from 'child_process';
import { readFile, writeFile } from 'fs';
import { Request, Response } from 'express';

export const PORT = 5000;
export const PUBLIC_FOLDER = __dirname + '/../../../tmp/recording';
export const FRAMES_ROOT_FOLDER = __dirname + '/../../../tmp/recording/pic';
export const GPS_ROOT_FOLDER = __dirname + '/../../../tmp/recording/gps';
export const IMU_ROOT_FOLDER = __dirname + '/../../../tmp/recording/imu';
export const LORA_ROOT_FOLDER = __dirname + '/../../../tmp/recording/lora';
export const BUILD_INFO_PATH = __dirname + '/../../../etc/version.json';
export const LED_CONFIG_PATH = __dirname + '/../../../tmp/led.json';
export const IMAGER_CONFIG_PATH =
  __dirname + '/../../../opt/dashcam/bin/config.json';
export const UPLOAD_PATH = __dirname + '/../../../tmp/';

export const configureOnBoot = async (req: Request, res: Response) => {
  try {
    const timeToSet = new Date(Number(req.query.time))
      .toISOString()
      .replace(/T/, ' ')
      .replace(/\..+/, '')
      .split(' ');

    // setting up initial time for camera
    exec('timedatectl set-ntp 0', () => {
      exec(`timedatectl set-time ${timeToSet[0]}`, () => {
        exec(`timedatectl set-time ${timeToSet[1]}`, () => {
          // TODO: Temp solution for restarting the camera to catch the freshest timestamp
          // Will be fixed outside of ODC API by polling the config and applying that on-the-fly
          exec('systemctl stop camera-bridge', () => {
            exec('systemctl start camera-bridge');
          });
        });
      });
    });

    res.json({
      output: 'done',
    });
  } catch (error) {
    res.json({ error });
  }
};

export const updateFirmware = async (req: Request, res: Response) => {
  try {
    const output = execSync('rauc install /tmp/' + req.query.filename, {
      encoding: 'utf-8',
    });
    res.json({
      output,
    });
  } catch (error: any) {
    res.json({ error: error.stdout || error.stderr });
  }
};

export const switchToP2P = async (req: Request, res: Response) => {
  try {
    // No need to wait for response — it's tearing down current Network method, so it will kill the connection anyways
    exec(__dirname + '/switch_P2P.sh');
    res.json({
      output: 'done',
    });
  } catch (error: any) {
    res.json({ error: error.stdout || error.stderr });
  }
};

export const switchToAP = async (req: Request, res: Response) => {
  try {
    exec(__dirname + '/switch_AP.sh');
    res.json({
      output: 'done',
    });
  } catch (error: any) {
    res.json({ error: error.stdout || error.stderr });
  }
};

export const updateCameraConfig = (newConfig: any) => {
  try {
    exec(
      'systemctl stop camera-bridge',
      {
        encoding: 'utf-8',
      },
      (error: ExecException | null) => {
        if (!error) {
          try {
            readFile(
              IMAGER_CONFIG_PATH,
              {
                encoding: 'utf-8',
              },
              (err: NodeJS.ErrnoException | null, data: string) => {
                let config: any = {};
                if (data && !err) {
                  config = JSON.parse(data);
                }

                config = {
                  ...config,
                  camera: {
                    ...config.camera,
                    ...newConfig,
                  },
                };

                try {
                  writeFile(
                    IMAGER_CONFIG_PATH,
                    JSON.stringify(config),
                    {
                      encoding: 'utf-8',
                    },
                    (err: NodeJS.ErrnoException | null) => {
                      if (err) {
                        console.log('Error updating camera config');
                      } else {
                        console.log('Successfully updated the camera config');
                      }
                      exec('systemctl start camera-bridge');
                    },
                  );
                } catch (e: unknown) {
                  exec('systemctl start camera-bridge');
                }
              },
            );
          } catch (e: unknown) {
            exec('systemctl start camera-bridge');
          }
        } else {
          exec('systemctl start camera-bridge');
        }
      },
    );
  } catch (e: unknown) {
    exec('systemctl start camera-bridge');
  }
};
