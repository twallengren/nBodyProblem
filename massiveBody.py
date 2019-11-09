#######################################################################################################################
# Author: Toren Wallengren
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