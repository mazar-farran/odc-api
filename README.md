<p align="center">
  <img src="/Open_Dashcam_logo.png?raw=true" width=40% height=40% />
</p>

# About the Open Dashcam (ODC)

The Open Dashcam (ODC) project is an open source hardware and software toolkit for building dashcam devices that collect data on the [Hivemapper Mapping Network](https://hivemapper.com/mapping-network#introduction). The ODC API provides the core software needed to run the dashcam and connect the dashcam to the Hivemapper App enabling data to be transferred to the mapping network via the app.

The [Hivemapper Dashcam](https://hivemapper.com/hivemapper-dashcam) is one of the first dashcams being built using the ODC software toolkit.

# Data Flow

The Open Dashcam (ODC) device and software enables collection and transfer of imagery and location data to the Hivemapper Mapping Network as illustrated below.

![End to End Data Flow](/hivemapper_data_transfer_process-3.png?raw=true 'Open Dashcam')

# ODC API

To make it up-n-running, it's as simple as

1. Make sure you have NodeJS installed on your device
2. Copy `/compiled` folder to some cozy place on your device (better lib/opt folders, /tmp is not a good idea)
3. Run the ODC API single-file service: `node dashcam-api.js`
4. Check if it's working: `http://<YOUR_DEVICE_IP>:5000/api/1/info` should return readable JSON to you
5. Enjoy!

# How to Compile

For a quick start,

`npm install`
`npm run build`
`npm run start`

Check if it's healthy:
`http://localhost:5000/api/1/info`

To configure it for your device,
create your own camera config file under `/config` folder, and make sure it is set as default under `/config/index.ts`

To build a standalone server file,
make sure you have ncc installed:

`npm i -g @vercel/ncc`

and then execute:

`npm run compile`

Server will get compiled into single file with bunch of fixtures next to it, and located in `compiled/` folder

To check if everything OK with compiled server file, execute:

`npm run start-compiled`

And double-check if it's healthy:

`http://localhost:5000/api/1/info`

# Overview

## API

### Index

- [Info](#info)
- [Init](#init)

### GPS

- [List Files](#gps-list)
- [Get single file](#gps-single)

### IMU

- [List Files](#imu-list)
- [Get single file](#imu-single)

### Recordings

- [List Files](#recordings-list)
- [Get single Frame](#recordings-single)

## API

Please note: the entire API prefixed with `api/1/` string.
So any request for you will start with `http://<Dashcam_Host>:<Api_Port>/api/1/<Api_Url>`

## Index

### Info

GET /info
Method to return information about current ODC API version and firmware data (build, version, etc)

```javascript
some here
```

### Init

GET /init?time=<UNIX_TIMESTAMP>
Request to initiate the communication between App and the camera. Requires current timestamp to be provided.
Camera time will be reset to the time provided by this API call.

```javascript
some here
```
