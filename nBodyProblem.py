import random
import math
import matplotlib.pyplot as plt
from matplotlib import animation

# units are:
# mass - solar masses
# distance - parsecs

# frames update every 50ms and each frame represents 1000 years

def getRandom(scale):

    return [scale*random.random() - scale/2, scale*random.random() - scale/2]

class nBodyProblem:

    def __init__(self, n = 3):

        self.system = nBodySystem()

        for i in range(0,n):

            self.system.addBody(massiveBody(
                mass = 10000 if i == 0 else random.randint(1,10),
                coordinate = [0, 0] if i == 0 else getRandom(2),
                velocity = [0, 0] if i == 0 else getRandom(1e-5),
                ))

    def iterateMotion(self):

        self.system.updateAccelerations()
        self.system.updateVelocities()
        self.system.updateCoordinates()

    def animateMotion(self):

        fig = plt.figure()
        ax = plt.axes(xlim=[-2,2], ylim=[-2,2])
        
        bodylist = []
        for index,body in enumerate(self.system.bodies):
            bodylist.append(ax.plot([], [], 'ko' if index==0 else 'ro')[0])

        pathlist = []
        for index in range(len(self.system.bodies)):
            pathlist.append(ax.plot([],[],lw=1)[0])
            
        # initialization function: plot the background of each frame
        def initBody():
            for index,body in enumerate(bodylist):
                bodyCoords = self.system.bodies[index].getCoordinate()
                body.set_data(bodyCoords[0], bodyCoords[1])
            return bodylist

        def initPath():
            for index,path in enumerate(pathlist):
                currentPath = self.system.bodies[index].path
                path.set_data(currentPath[0], currentPath[1])
            return pathlist

        # animation function.  This is called sequentially
        def animateBody(i):
            for index,body in enumerate(bodylist):
                bodyCoords = self.system.bodies[index].getCoordinate()
                body.set_data(bodyCoords[0], bodyCoords[1])
            return tuple(bodylist)

        def animatePath(i):
            self.iterateMotion()
            for index,path in enumerate(pathlist):
                path.set_data(self.system.bodies[index].path[0],
                            self.system.bodies[index].path[1])
            return tuple(pathlist)

        # call the animator.  blit=True means only re-draw the parts that have changed.
        animPath = animation.FuncAnimation(fig, animatePath, init_func=initPath, frames=1000,
                                       interval=50, blit=False)
        # call the animator.  blit=True means only re-draw the parts that have changed.
        animBody = animation.FuncAnimation(fig, animateBody, init_func=initBody, frames=1000,
                                       interval=50, blit=False)
        
        plt.show()
        

class nBodySystem:

    def __init__(self):

        self.bodies = []
        self.G = 4.915e-15
        self.deltaTime = 1000

    def addBody(self, massiveBody):

        self.bodies.append(massiveBody)

    def updateCoordinates(self):

        for body in self.bodies:
            coord = body.getCoordinate()
            vel = body.getVelocity()
            newCoordinate = [coord[0] + vel[0]*self.deltaTime, coord[1] + vel[1]*self.deltaTime]
            body.setCoordinate(newCoordinate)

    def updateVelocities(self):

        for body in self.bodies:
            vel = body.getVelocity()
            acc = body.getAcceleration()
            newVelocity = [vel[0] + acc[0]*self.deltaTime, vel[1] + acc[1]*self.deltaTime]
            body.setVelocity(newVelocity)

    def updateAccelerations(self):

        for bodyOne in self.bodies:
            netForce = [0, 0]
            for bodyTwo in self.bodies:
                if bodyOne != bodyTwo:
                    coordOne = bodyOne.getCoordinate()
                    massOne = bodyOne.getMass()
                    coordTwo = bodyTwo.getCoordinate()
                    massTwo = bodyTwo.getMass()
                    forceDirection = [coordOne[0] - coordTwo[0], coordOne[1] - coordTwo[1]]
                    directionMagnitude = math.sqrt(forceDirection[0]**2 + forceDirection[1]**2)
                    forceMagnitude = self.G*massOne*massTwo/directionMagnitude**2
                    force = [forceMagnitude*direction/directionMagnitude for direction in forceDirection]
                    netForce = [netForce[0] + force[0], netForce[1] + force[1]]
            newAcceleration = [-forceComp/bodyOne.getMass() for forceComp in netForce]
            bodyOne.setAcceleration(newAcceleration)
        
class massiveBody:

    def __init__(self,
                 mass = 1,
                 coordinate = (0, 0),
                 velocity = (0, 0),
                 acceleration = (0, 0)):

        self.mass = mass
        self.path = [[],[]]
        self.setCoordinate(coordinate)
        self.setVelocity(velocity)
        self.setAcceleration(acceleration)

    def getVelocity(self):

        return self.velocity

    def setVelocity(self, velocity):

        self.velocity = velocity

    def getCoordinate(self):

        return self.coordinate

    def setCoordinate(self, coordinate):

        self.path[0].append(coordinate[0])
        self.path[1].append(coordinate[1])
        self.coordinate = coordinate

    def getMass(self):

        return self.mass

    def getAcceleration(self):

        return self.acceleration

    def setAcceleration(self, acceleration):

        self.acceleration = acceleration

    def __eq__(self, other):

        equalCoordinates = self.getCoordinate() == other.getCoordinate()
        equalMasses = self.getMass() == other.getMass()
        equalVelocities = self.getVelocity() == other.getVelocity()
        equalAccelerations = self.getAcceleration() == other.getAcceleration()

        return equalCoordinates & equalMasses & equalVelocities & equalAccelerations

################################################################################
################################################################################
# Define script behavior

if __name__ == '__main__':

    n = nBodyProblem(n=20)
    n.animateMotion()
