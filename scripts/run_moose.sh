#!/bin/bash

# unprivileged UID to run under
MYUID=`id www-data -u`
MYGID=`id www-data -g`

# source MOOSE profile
. /opt/moose/environments/moose_profile

# source config
. $(dirname $0)/moose.config

# overlayfs name (sanitize for security)
NAME=${1//[^a-zA-Z0-9_]/}

# overlay directories
OVER=/var/overlay
WORK=$OVER/work/$NAME
UPPER=$OVER/upper/$NAME
MNT=$OVER/mnt/$NAME

# chroot lower
LOWER=/var/chroot/moose

# make directories and mount points (UPPER is created by the webserver)
mkdir -p $WORK
mkdir -p $MNT

# mount overlay
mount -t overlay overlay -o lowerdir=$LOWER,upperdir=$UPPER,workdir=$WORK $MNT

# run moose
export TERM=xterm-256color
timeout 120s chroot --userspec $MYUID:$MYGID $MNT ${MOOSE_EXECUTABLE} --color on -i input.i
MOOSE_RETURN=$?

# convert vtu to vtp
which vtu2vtp > /dev/null && { 
  find $UPPER -name \*.vtu -exec vtu2vtp \{\} \{\}.vtp \; 
}

# unmount overlayfs
umount $MNT

# pass back moose return code
exit $MOOSE_RETURN
