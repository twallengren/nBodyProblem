import random
from massiveBody import massiveBody
from nBodySystem import nBodySystem

# units are:
# mass - solar masses
# distance - parsecs

# frames update every 50ms and each frame represents 1000 years

class nBodyProblem:

    def __init__(self, n = 3):

        self.system = nBodySystem()

        for i in range(0,n):

            self.system.addBody(massiveBody(
                mass = 10000 if i == 0 else random.randint(1,10),
                coordinate = [0, 0] if i == 0 else [random.uniform(-1,1),random.uniform(-1,1)],
                velocity = [0, 0] if i == 0 else [random.uniform(-1e-5,1e-5),random.uniform(-1e-5,1e-5)],
                ))

    def iterateMotion(self):

        self.system.updateAccelerations()
        self.system.updateVelocities()
        self.system.updateCoordinates()

################################################################################
################################################################################
# Define script behavior

if __name__ == '__main__':

    n = nBodyProblem(n=20)
    n.animateMotion()
