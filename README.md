# CognitiveCanvas - ConceptMapping

CognitiveCanvas - ConceptMapping is a collaborative concept mapping tool built on webstrates, which serves as the lowerlevel webapp for (iframed by) CognitiveCanvas. CognitiveCanvas - ConceptMapping facilitates mapping, drawing, styling, and passing node/edge information to the upperlevel container webapp.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

### Installing

Clone the repository to local machine with 'git clone https://github.com/CognitiveCanvas/CognitiveCanvas-Mapping.git'

Install all the required dependencies by navigating to the directory in which you installed CognitiveCanvas and running 'npm install'

The raw html code is in index.html, the referenced javascript files are in src/, and stylesheets are in styles/.  All code that will be deployed to a webstrate will be put in dist/.

### Testing

To deploy a webstrate, all you need to do is build the code with Webpack, then deploy with [Webstrates-File-System](https://github.com/Webstrates/file-system).

To build with webpack, navigate to the root directory and run 'npm run dev'.  This will put webpack in "watch" mode so that any changes you make to the code will automatically rebuild the dist/ code.  This also has added features like a source-map which allows for easy debugging in the browser, however this code is not optimized.  For production builds, see the "Production" section.

If you are testing on a remote server, navigate to CognitiveCanvas/dist after you have webpack running and run 
	wfs --id=<WEBSTRATE_ID> --host=<USERNAME>:<PASSWORD>@<DOMAIN> <PATH_TO_DIST_DIRECTORY>
	example: wfs --id=CogCanvas_Development --host=web:strate@webstrates.ucsd.edu .
This will create an instance of Webstrates File System, which will automatically sync the html, javascript, and css found in /dist to the server and webstrate ID you specified.  To see the webstrate go to <DOMAIN>/<WEBSTRATE_ID> (ex: www.webstrates.ucsd.edu/CogCanvas_Development).

In order to test the webstrate locally, you will need your own [Webstrate](https://webstrates.github.io/) server running on internet or your localhost. Refer to [Webstrate-File-System](https://github.com/Webstrates/file-system) documentation about how to link resources and assets in external files to the html page and how to publish the html page to your webstrate server. 

### Deployment

1. From CognitiveCanvas-Mapping/ run 'npm run build', which will create an optimized bundle of the code in /dist
2. Navigate to CognitiveCanvas-Mapping/dist and run 
	wfs --id=<WEBSTRATE_ID> --host=<USERNAME>:<PASSWORD>@<DOMAIN> --oneshot .
	ex: wfs --id=CogCanvas_Master --host=web:strate@webstrates.ucsd.edu --oneshot .
The --oneshot option will cause all the code to be deployed to the Webstrate_ID once and terminate, instead of continuously syncing.

## Restarting Webstrate Server

You may encounter a situation where your [Webstrate](https://webstrates.github.io/) server is down and the page keeps showing "Loading Webstrates". This is not because of bugs in your code. It is often because the webstrate server crushes for different reasons.

### To Fix the Server Crash

Login to webstrates.ucsd.edu (or your published server) with an account with sudoer permission.

Navigate to the root of Webstrate:

```
cd /opt/Webstrate
```

Locate the code that crushes the server. Fix it! 

Then navigate back to the root of Webstrate(/opt/Webstrates) and run:

```
sudo npm run build
```

Restart the server by running:

```
sudo systemctl restart webstrates
```

## Renewal of the Certificate

You may encounter a situation where the browser gives you a "Your connection is not private" message and a "Net::ERR_CERT_DATE_INVALID" error code. This means the certificate on the server is outdated and needs renewal.

### To Renewl the Certificate on the Server

Stop all the nglinx connections to the ports

```
sudo service nginx stop
```

Renew the certificate using letsencrypt

```
sudo letsencrypt renew
```

Restart the nglinx

```
sudo service nginx start
```

Re-build & Deploy all the Servers (webstrate & container_server) & Apps (container_client)

## Authors

### Project Manager
* **Amy Fox**

### System Dev Team (Name Ranked by First Name)
* **Gaurav "Gav" Parmar**
* **Issac Fehr**
* **Michael Tolentino**
* **Xiangyu "Steve" Zhao**     
* **Xinwei "Xavier" Wang**
    
### User Interface Dev Team
* **Issac Fehr**
* **Helen Cheng**
* **Joshua Tjong**