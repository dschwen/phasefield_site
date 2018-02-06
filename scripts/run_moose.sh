#!/bin/bash

# unprivileged UID to run under
MYUID=`id www -u`
MYGID=`id www -g`

# source MOOSE profile
#echo Loading MOOSE environment...
. /opt/moose/environments/moose_profile

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
#echo Mounting overlay file system...
mount -t overlay overlay -o lowerdir=$LOWER,upperdir=$UPPER,workdir=$WORK $MNT

# run moose
#echo Running MOOSE...
timeout 120s chroot --userspec $MYUID:$MYGID $MNT /home/daniel/moose/modules/combined/combined-opt -i input.i
MOOSE_RETURN=$?

# unmount overlayfs
#echo Unmounting overlay file system...
umount $MNT

# pass back moose return code
exit $MOOSE_RETURN
