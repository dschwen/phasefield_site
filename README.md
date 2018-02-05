# Phasefield.net

## Setup

Assuming the webserver runs as user `www` and the site is installed at `/var/www/phasefield_site`

### `sudo` setup 

Add 

```
www ALL = (root) NOPASSWD: /var/www/phasefield_site/scripts/run_moose.sh
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
makejail /var/www/phasefield_site/scripts/moose.py
```


