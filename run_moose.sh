#!/bin/bash

# source MOOSE profile
echo Loading MOOSE environment...
. /opt/moose/environments/moose_profile

# overlayfs name
NAME=test

# overlay directories
OVER=/var/overlay
WORK=$OVER/work/$NAME
UPPER=$OVER/upper/$NAME
MNT=$OVER/mnt/$NAME


# chroot lower
LOWER=/var/chroot/moose

# make directories and mount points
mkdir -p $WORK
mkdir -p $UPPER
mkdir -p $MNT

# mount overlay
echo Mounting overlay file system...
mount -t overlay overlay -o lowerdir=$LOWER,upperdir=$UPPER,workdir=$WORK $MNT

# run moose
echo Running MOOSE...
chroot --userspec daniel:daniel /var/chroot/moose /home/daniel/moose/modules/combined/combined-opt -i test.i
echo $UPPER

# unmount overlayfs
echo Unmounting overlay file system...
#umount $MNT
