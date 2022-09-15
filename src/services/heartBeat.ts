import { exec, ExecException } from 'child_process';
import { IService } from 'types';
import { setLockTime, setCameraTime } from 'util/lock';
// import { isPairing, repairNetworking } from 'util/network';
import { COLORS, updateLED } from '../util/led';

let previousCameraResponse = '';
let mostRecentPing = 0;
let isFirmwareUpdate = false;
let wasGpsGood = false;

export const setMostRecentPing = (_mostRecentPing: number) => {
  mostRecentPing = _mostRecentPing;
};

export const switchToFirmwareUpdate = (state: boolean) => {
  isFirmwareUpdate = state;
};

export const HeartBeatService: IService = {
  execute: async () => {
    try {
      if (isFirmwareUpdate) {
        updateLED(COLORS.PURPLE, COLORS.PURPLE, COLORS.PURPLE);
        return;
      }
      // ubxtool -p NAV-PVT | grep fix
      // grep fix ${GPS_ROOT_FOLDER}/"$(ls ${GPS_ROOT_FOLDER} | tail -1)" | tail -1
      exec(
        'ubxtool -p NAV-PVT | grep fix',
        {
          encoding: 'utf-8',
        },
        (error: ExecException | null, stdout: string) => {
          const ubxtoolOutput = error ? '' : stdout;

          exec(
            `systemctl is-active camera-bridge && ls /mnt/data/pic/ | tail -1`,
            {
              encoding: 'utf-8',
            },
            (error: ExecException | null, stdout: string) => {
              const cameraResponse = error ? '' : stdout;

              try {
                let gpsLED = COLORS.RED;

                if (ubxtoolOutput.indexOf('fixType 3') !== -1) {
                  gpsLED = COLORS.GREEN;
                  setLockTime();
                  setCameraTime();
                  if (!wasGpsGood) {
                    console.log('Got 3d Fix');
                  }
                  wasGpsGood = true;
                } else {
                  if (ubxtoolOutput.indexOf('fixType 2') !== -1) {
                    gpsLED = COLORS.YELLOW;
                  }
                  if (wasGpsGood) {
                    console.log('Lost 3d Fix');
                  }
                  wasGpsGood = false;
                }

                const imgLED =
                  cameraResponse.indexOf('active') === 0
                    ? cameraResponse !== previousCameraResponse
                      ? previousCameraResponse
                        ? COLORS.GREEN
                        : COLORS.YELLOW
                      : COLORS.YELLOW
                    : COLORS.RED;
                previousCameraResponse = cameraResponse;

                const appDisconnectionPeriod = mostRecentPing
                  ? Math.abs(Date.now() - mostRecentPing)
                  : 30000;

                let appLED = COLORS.RED;
                if (appDisconnectionPeriod < 15000) {
                  appLED = COLORS.GREEN;
                } else {
                  appLED = COLORS.YELLOW;
                }
                updateLED(imgLED, gpsLED, appLED);
              } catch (e: unknown) {
                console.log(e);
              }
            },
          );
        },
      );
    } catch (e: unknown) {
      console.log('LED service failed with error', e);
    }
  },
  interval: 7000,
};
