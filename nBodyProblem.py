import random
import matplotlib.pyplot as plt
from matplotlib import animation
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

################################################################################
################################################################################
# Define script behavior

if __name__ == '__main__':

    n = nBodyProblem(n=20)
    n.animateMotion()
