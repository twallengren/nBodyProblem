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
                mass = 1000000 if i == 0 or i == 1 else random.randint(1,100),
                coordinate = [0, 0] if i == 0 else [random.uniform(-5,5),random.uniform(-5,5)],
                velocity = [0, 0] if i == 0 else [random.uniform(-5e-5,5e-5),random.uniform(-5e-5,5e-5)],
                ))

    def iterateMotion(self):

        self.system.updateAccelerations()
        self.system.updateVelocities()
        self.system.updateCoordinates()
