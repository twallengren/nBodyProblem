#######################################################################################################################
# Author: Toren Wallengren
#######################################################################################################################

import math

class nBodySystem:
    """This class represents a system of N massive bodies and contains methods to update positions, velocities, and
    accelerations of all bodies based on Newtonian Physics."""

    def __init__(self):
        """Initialize instance variables."""

        self.bodies = [] # empty list to store massive bodies
        self.G = 4.915e-15 # Newton's Constant G (units in parsecs, years, and solar masses)
        self.deltaTime = 1000 # Time step in years (every frame update represents this many years of time)

    def addBody(self, massiveBody):
        """Add new body to system - must be of massiveBody class."""

        self.bodies.append(massiveBody)

    def updateCoordinates(self):
        """Update positions based on current velocities using Euler's Method."""

        for body in self.bodies:
            coord = body.getCoordinate()
            vel = body.getVelocity()
            newCoordinate = [coord[0] + vel[0]*self.deltaTime, coord[1] + vel[1]*self.deltaTime]
            body.setCoordinate(newCoordinate)

    def updateVelocities(self):
        """Update velocities based on current accelerations using Euler's Method."""

        for body in self.bodies:
            vel = body.getVelocity()
            acc = body.getAcceleration()
            newVelocity = [vel[0] + acc[0]*self.deltaTime, vel[1] + acc[1]*self.deltaTime]
            body.setVelocity(newVelocity)

    def updateAccelerations(self):
        """Update accelerations using a Newtonian formulation of Gravity."""

        for bodyOne in self.bodies:
            coordOne = bodyOne.getCoordinate()
            massOne = bodyOne.getMass()
            netForce = [0, 0]
            for bodyTwo in self.bodies:
                if bodyOne != bodyTwo:
                    coordTwo = bodyTwo.getCoordinate()
                    massTwo = bodyTwo.getMass()
                    forceDirection = [coordOne[0] - coordTwo[0], coordOne[1] - coordTwo[1]]
                    directionMagnitude = math.sqrt(forceDirection[0]**2 + forceDirection[1]**2)
                    forceMagnitude = self.G*massOne*massTwo/directionMagnitude**2
                    force = [forceMagnitude*direction/directionMagnitude for direction in forceDirection]
                    netForce = [netForce[0] + force[0], netForce[1] + force[1]]
            newAcceleration = [-forceComp/massOne for forceComp in netForce]
            bodyOne.setAcceleration(newAcceleration)