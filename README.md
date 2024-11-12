## Intro

An experimental project to explore visualising different layers of an embedded system and it's application and network layer using VR system for purposes of testing, debuggong or monitoring purposes.

It is difficult to represent and visualise all layers of an implementation on one or two monitors due to space or set-up. Setting up a VR environment and display all relevant data in an environment could prove more inuitive in representing a full system. 

More overhead potentially is required to implement the additional logging features. 

Baseline used for setting up the project:
* VR platform : Oculus Quest 2
* VR visualisation : WebXR - ThreeJS
* Server : Express 
* Embedded platform : ESP32

## Setting up

NodeJS 17 or higher

WebXR requires to run through secure https if not ran through localhost. To run untethered on local server, have to set up self-certified certificates.
Set up certificates in the project dir.

```sh
    openssl genrsa -out server.key 2048
    openssl req -new -key server.key -out server.csr
    openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.cert
```

Running the project
```sh
npm install
npm build
npm run
```
