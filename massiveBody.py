#######################################################################################################################
# Author: Toren Wallengren
#######################################################################################################################

class massiveBody:
    """This class represents a single massive body with mass, position (coordinate), velocity, and acceleration. Keeps
    track of coordinate change over time with the path instance variable."""

    def __init__(self,
                 mass = 1,
                 coordinate = (0, 0),
                 velocity = (0, 0),
                 acceleration = (0, 0)):
        """Initialize instance variables."""

        self.mass = mass
        self.path = [[],[]]
        self.setCoordinate(coordinate)
        self.setVelocity(velocity)
        self.setAcceleration(acceleration)

    def getVelocity(self):
        """Velocity getter method."""

        return self.velocity

    def setVelocity(self, velocity):
        """Velocity setter method."""

        self.velocity = velocity

    def getCoordinate(self):
        """Position/coordinate getter method."""

        return self.coordinate

    def setCoordinate(self, coordinate):
        """Position/coordinate setter method - updates path instance variable as well."""

        self.path[0].append(coordinate[0])
        self.path[1].append(coordinate[1])
        self.coordinate = coordinate

    def getMass(self):
        """Mass getter method."""

        return self.mass

    def getAcceleration(self):
        """Acceleration getter method."""

        return self.acceleration

    def setAcceleration(self, acceleration):
        """Acceleration setter method."""

        self.acceleration = acceleration

    def __eq__(self, other):
        """Define equality between two massive bodies. This definition is utilized in nBodySystem.py to prevent the
        program from trying to compute the force of gravity of an object on itself (which would be singular)."""

        equalCoordinates = self.getCoordinate() == other.getCoordinate()
        equalMasses = self.getMass() == other.getMass()
        equalVelocities = self.getVelocity() == other.getVelocity()
        equalAccelerations = self.getAcceleration() == other.getAcceleration()

        return equalCoordinates & equalMasses & equalVelocities & equalAccelerations