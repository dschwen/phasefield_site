# Phasefield.net

## Setup

Assuming the webserver runs as user `www-data` and the site is installed at `/var/www/phasefield_site`

### `sudo` setup 

Add 

```
www-data ALL = (root) NOPASSWD: /var/www/phasefield_site/scripts/run_moose.sh
```

To the bottom of `/etc/sudoers`. Make sure the `run_moose.sh` is not writable by any unprivileged account!

### MOOSE compile

Install the redistributable package and build MOOSE in any user home directory as an unprivileged user. Here it is built in `/home/daniel/moose`.

```
cd /home/daniel/moose
./scripts/update_and_rebuild_libmesh.sh
cd modules/combined
make -j 4
```

Now as root create a directory to hold the MOOSE base root jail at `/var/chroot/moose` and run.

```
apt-get install makejail
mkdir -p /var/chroot/moose
makejail /var/www/phasefield_site/scripts/moose.py
```

Next create the directories for overlayfs 

```
mkdir -p /var/overlay/upper
chown www-data:www-data /var/overlays/upper
```

### Launcing the server

The node based server is started with

```
./bin/www
```
in the `phasefield_site` direcctory. If the server is startrd wit super user privileges it drops these privileges by switching to 
the user and group specified in the `WWW_USER` and `WWW_GROUP` environment variables (defaulting to `www-data`).

The server binds to the port specified in the `PORT` environment variable (defaults to 80). If the server should run on a privileged port
it needs to be launched either with super user priviliges (which are dropped as soon as the port is bound) or using `authbind`.
