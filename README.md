# Phasefield.net

## Setup

Assuming the webserver runs as user `www-data` and the site is installed at `/var/www/phasefield_site`

### `sudo` setup 

Add 

```
www-data ALL = (root) NOPASSWD: /var/www/phasefield_site/scripts/run_moose.sh
```

To the bottom of `/etc/sudoers`. Make sure the `run_moose.sh` is not writable by any unprivileged account!

### Prerequisites

```
sudo apt install nodejs npm makejail
```

### MOOSE compile

Install the redistributable package and build MOOSE in any user home directory as an unprivileged user. 
In the root of the moose repository run

```
./scripts/update_and_rebuild_libmesh.sh
cd modules/combined
make -j 4
```

Now in the combined directory run the install script

```
sudo /var/www/phasefield_site/scripts/install.sh
```

### Launching the server

The node based server is started with

```
cd /var/www/phasefield_site
sudo ./bin/www
```

If the server is started with super user privileges it drops these privileges by switching to 
the user and group specified in the `WWW_USER` and `WWW_GROUP` environment variables (defaulting to `www-data`).

The server binds to the port specified in the `PORT` environment variable (defaults to 80). If the server should run on a privileged port
it needs to be launched either with super user priviliges (which are dropped as soon as the port is bound) or using `authbind`.
