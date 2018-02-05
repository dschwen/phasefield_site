#
# Run makejail using this configuration file
#

chroot="/var/chroot/moose"

testCommandsInsideJail=["/home/daniel/moose/modules/combined/combined-opt"]
processNames=["combined-opt"]

users=["daniel"]
groups=["daniel"]

keepStraceOutputs=1

