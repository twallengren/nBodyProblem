#######################################################################################################################
# Author: Toren Wallengren
import random
from massiveBody import massiveBody
from nBodySystem import nBodySystem

# units are:
# mass - solar masses
# distance - parsecs
# time - years

# frames update every 50ms and each frame represents 1000 years

class nBodyProblem:

    initSpeed = 4e-5

    def __init__(self, n):

        self.system = nBodySystem()

        # add first black hole
        self.system.addBody(massiveBody(
            mass=1000000,
            coordinate=[2, 0],
            velocity=[0, -3e-5]
        ))

        # add second black hole
        self.system.addBody(massiveBody(
            mass=1000000,
            coordinate=[-2, 0],
            velocity=[0, 3e-5]
        ))

        for i in range(0,n):

            self.system.addBody(massiveBody(
                mass = random.randint(10,100),
                coordinate = [random.uniform(-10,10),random.uniform(-10,10)],
                velocity = [random.uniform(-self.initSpeed,self.initSpeed),random.uniform(-self.initSpeed,self.initSpeed)],
                ))

    def iterateMotion(self):

        self.system.updateAccelerations()
        self.system.updateVelocities()
        self.system.updateCoordinates()
