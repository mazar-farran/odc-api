// https://cdn.sparkfun.com/assets/learn_tutorials/8/1/5/u-blox8-M8_ReceiverDescrProtSpec__UBX-13003221__Public.pdf
// https://content.u-blox.com/sites/default/files/products/documents/MultiGNSS-Assistance_UserGuide_%28UBX-13004360%29.pdf
import cp from 'child_process';
import fs from 'fs';

const EMPTY_PAYLOAD = new Uint8Array(0);
const DEFAULT_ALAMANC_FIXTURE = 'fixtures/mgaoffline.ubx';
const BLOCK_LENGTH = 128;

type UBX_MGA_COMMAND = 'UBX-MGA-FLASH-DATA' & 'UBX_MGA_FLASH-STOP';
const UBX_COMMAND_CLASS_ID_BYTES: Record<UBX_MGA_COMMAND, string> = {
  'UBX-MGA-FLASH-DATA': '13,21',
  'UBX-MGA-FLASH-STOP': '13,22',
};

function readMGAOffline(fileIn = DEFAULT_ALAMANC_FIXTURE) {
  const buf = fs.readFileSync(fileIn);
  // get blocks of 512 bytes
  const blocks: Buffer[] = [];

  for (let i = 0; i < buf.length; i += BLOCK_LENGTH) {
    const start = i * BLOCK_LENGTH;
    const end = Math.min(buf.length, (i + 1) * BLOCK_LENGTH);
    blocks.push(buf.slice(start, end));
  }

  return blocks;
}

function makeCommand(mgaCommand: UBX_MGA_COMMAND, block?: Buffer) {
  //@ts-ignore
  if (block) {
    const payload: string[] = [];
    for (let i = 0; i < block.length; i += 2) {
      payload.push(block.slice(i, i + 2).toString('hex'));
    }
    return `${UBX_COMMAND_CLASS_ID_BYTES[mgaCommand]},${payload.join(',')}`;
  } else {
    return UBX_COMMAND_CLASS_ID_BYTES[mgaCommand];
  }
}

function parseMsg(data: string) {
  const lines = data.split('\n');
  if (!lines.length) {
    throw new Error(`Expected Message UBX-MGA-FLASH-ACK`);
  }
  const i = lines.findIndex(line => line.indexOf('UBX-MGA-FLASH') !== -1);
  if (i === -1) {
    throw new Error(`Expected Message UBX-MGA-FLASH-ACK`);
  }
  const bytes = lines[i + 1]
    .split('raw ')[1]
    .split(',')
    .map(byte => `0x${byte}`);
  if (bytes[0] !== '0x03') {
    throw new Error(`Expected Message UBX-MGA-FLASH-ACK`);
  }

  switch (bytes[2]) {
    case '0x00':
      return 'ACK';
    case '0x01':
      return 'NACK-RETRY';
    case '0x02':
      return 'NACK-ABORT';
    default:
      throw new Error(`Expected reponse 0-2`);
  }
}

/**
 The host downloads a copy of a latest data from the AssistNow Offline service and stores it locally.
• It sends the first 512 bytes of that data using the UBX-MGA-FLASH-DATA message.
• It awaits a UBX-MGA-FLASH-ACK message in reply.
• Based on the contents of the UBX-MGA-FLASH-ACK message, the host sends the next block, resends
the last block or aborts the whole process.
 */
export function submitOfflineAlmanac() {
  const blocks = readMGAOffline();
  const msgQueue = blocks.map(block =>
    makeCommand('UBX-MGA-FLASH-DATA' as UBX_MGA_COMMAND, block),
  );
  msgQueue.push(makeCommand('UBX-MGA-FLASH-STOP' as UBX_MGA_COMMAND));
  // msgQueue.unshift(makeCommand('UBX-MGA-FLASH-STOP' as UBX_MGA_COMMAND));

  let idx = 0;
  while (idx < msgQueue.length) {
    const msg = msgQueue[idx];
    const cmd = `ubxtool -c ${msg}`;
    console.log(cmd);

    const resp = String(cp.execSync(cmd));
    console.log(resp);

    const parsed = parseMsg(resp);

    if (parsed === 'ACK') {
      idx++;
      continue;
    } else if (parsed === 'NACK-RETRY') {
      continue;
    } else if (parsed === 'NACK-ABORT') {
      throw new Error('UBX-MGA-FLASH-ACK says Abort!');
    }
  }
}
