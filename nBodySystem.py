import math

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