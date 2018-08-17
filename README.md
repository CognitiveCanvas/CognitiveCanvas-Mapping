# CognitiveCanvas - ConceptMapping

CognitiveCanvas - ConceptMapping is a collaborative concept mapping tool built on webstrates, which serves as the lowerlevel webapp for (iframed by) CognitiveCanvas. CognitiveCanvas - ConceptMapping facilitates mapping, drawing, styling, and passing node/edge information to the upperlevel container webapp.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

In order to publish the ConceptMapping on Webstrate server, you will need to install the [Webstrate-File-System](https://github.com/Webstrates/file-system).

### Installing

Download the repository to your local system. The raw html code are in index.html, the referenced javascript files are in src/, and stylesheets are in styles/. You do not need extra installation to access the codes.

### Testing

In order to test the webstrate, you will need your own [Webstrate](https://webstrates.github.io/) server running on internet or your localhost. Refer to [Webstrate-File-System](https://github.com/Webstrates/file-system) documentation about how to link resources and assets in external files to the html page and how to publish the html page to your webstrate server. 

## Restarting Webstrate Server

You may encounter a situation where your [Webstrate](https://webstrates.github.io/) server is down and the page keeps showing "Loading Webstrates". This is not because of bugs in your code. It is often because the webstrate server crushes for different reasons.

### To Fix the Server Crush

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
    
### User Interface Dev Team (Name Ranked by First Name)
* **Helen Cheng**
* **Joshua Tjong**