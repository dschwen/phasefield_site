#!/bin/bash

# are we root
if [ ! $UID -eq 0 ]
then
	echo Run the installer as root
	exit 1
fi

# create folders
mkdir -p /var/chroot/moose
mkdir -p /var/overlay/upper
chown www-data:www-data /var/overlay/upper

# check if we're in the right folder
MOOSE_EXECUTABLE=`pwd`/combined-opt
if [ ! -x ${MOOSE_EXECUTABLE} ]
then
	echo Run this from the MOOSE combined module folder
	exit 1
fi
MAKEJAIL_CONFIG=moose_makejail.py

# write moose path config
echo 'MOOSE_EXECUTABLE='${MOOSE_EXECUTABLE} > $(dirname $0)/moose.config

# write makejail config
cat << EOF > $MAKEJAIL_CONFIG
chroot="/var/chroot/moose"
cleanJailFirst=True

testCommandsInsideJail=["${MOOSE_EXECUTABLE}"]
processNames=["combined-opt"]

users=["daniel"]
groups=["daniel"]

keepStraceOutputs=1
EOF

# run makejail
makejail $MAKEJAIL_CONFIG

# cleanup
rm $MAKEJAIL_CONFIG
