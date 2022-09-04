import { exec, execSync, ExecException } from 'child_process';
import { Request, Response } from 'express';
import { writeFile } from 'fs';

export const PORT = 5000;
export const PUBLIC_FOLDER = __dirname + '/../../../mnt/data';
export const FRAMES_ROOT_FOLDER = __dirname + '/../../../mnt/data/pic';
export const GPS_ROOT_FOLDER = __dirname + '/../../../mnt/data/gps';
export const IMU_ROOT_FOLDER = __dirname + '/../../../mnt/data/imu';
export const LORA_ROOT_FOLDER = __dirname + '/../../../mnt/data/lora';
export const BUILD_INFO_PATH = __dirname + '/../../../etc/version.json';
export const LED_CONFIG_PATH = __dirname + '/../../../tmp/led.json';
export const IMAGER_CONFIG_PATH =
  __dirname + '/../../../opt/dashcam/bin/emmc_config.json';
export const IMAGER_BRIDGE_PATH =
  __dirname + '/../../../opt/dashcam/bin/bridge.sh';
export const UPLOAD_PATH = __dirname + '/../../../mnt/data/';
export const NETWORK_BOOT_CONFIG_PATH =
  __dirname + '/../../../mnt/data/network_mode.txt';
export const NETWORK_CONFIG_PATH = __dirname + '/../network-mode.txt';

export const configureOnBoot = async (req: Request, res: Response) => {
  try {
    // const realTime = Number(req.query.time);
    // const timeToSet = new Date(realTime)
    //   .toISOString()
    //   .replace(/T/, ' ')
    //   .replace(/\..+/, '')
    //   .split(' ');

    // // setting up initial time for camera
    // exec('timedatectl set-ntp 0', () => {
    //   exec(`timedatectl set-time ${timeToSet[0]}`, () => {
    //     exec(`timedatectl set-time ${timeToSet[1]}`, () => {
    //       // TODO: Temp solution for restarting the camera to catch the freshest timestamp
    //       // Will be fixed outside of ODC API by polling the config and applying that on-the-fly
    //       exec('systemctl stop camera-bridge', () => {
    //         exec('systemctl start camera-bridge');
    //       });
    //     });
    //   });
    // });

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
    exec(__dirname + '/network/test_P2Pconnect_any.sh');
    try {
      writeFile(NETWORK_BOOT_CONFIG_PATH, 'P2P', null, () => {});
    } catch (e: unknown) {
      console.log(e);
    }
    res.json({
      output: 'done',
    });
  } catch (error: any) {
    res.json({ error: error.stdout || error.stderr });
  }
};

export const switchToAP = async (req: Request, res: Response) => {
  try {
    exec(__dirname + '/network/wifi_switch_AP.sh');
    try {
      writeFile(NETWORK_BOOT_CONFIG_PATH, 'AP', null, () => {});
    } catch (e: unknown) {
      console.log(e);
    }
    res.json({
      output: 'done',
    });
  } catch (error: any) {
    res.json({ error: error.stdout || error.stderr });
  }
};

export const updateCameraConfig = (replaceLine: string, path: string) => {
  try {
    exec(
      'systemctl stop camera-bridge',
      {
        encoding: 'utf-8',
      },
      (error: ExecException | null) => {
        if (!error) {
          try {
            exec(
              `sed -i 's/${replaceLine}/g' ${path}`,
              {
                encoding: 'utf-8',
              },
              () => {
                console.log('Successfully restarted the camera');
                exec('systemctl start camera-bridge');
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
