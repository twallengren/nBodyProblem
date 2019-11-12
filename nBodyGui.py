#######################################################################################################################
# Author: Toren Wallengren
import matplotlib
matplotlib.use("TkAgg")
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg, NavigationToolbar2Tk
import matplotlib.pyplot as plt
from matplotlib import animation
import tkinter as tk
from tkinter import ttk
from nBodyProblem import nBodyProblem
LARGE_FONT = ("Verdana", 12)

class nBodyGui(tk.Tk):
    def __init__(self, *args, **kwargs):
        tk.Tk.__init__(self, *args, **kwargs)

        tk.Tk.wm_title(self, "N-Body System Simulation")

        container = tk.Frame(self)
        container.pack(side="top", fill="both", expand=True)
        container.grid_rowconfigure(0, weight=1)
        container.grid_columnconfigure(0, weight=1)

        self.frames = {}

        for F in (StartPage, SimulationPage):
            frame = F(container, self)

            self.frames[F] = frame

            frame.grid(row=0, column=0, sticky="nsew")

        self.show_frame(StartPage)

    def show_frame(self, cont):
        frame = self.frames[cont]
        frame.tkraise()


class StartPage(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent)
        label = tk.Label(self, text="Home Page", font=LARGE_FONT)
        label.pack(pady=10, padx=10)

        simulationPageButton = ttk.Button(self, text="Simulation Page",
                             command=lambda: controller.show_frame(SimulationPage))
        simulationPageButton.pack()

        detailsLabel = tk.Label(self, text="Units are as follows: \n Mass => Solar Masses \n Distance => Parsecs \n Time => Years \n \n Frames update every 50ms \n Every frame update represents 1000 years of real time", font=LARGE_FONT)
        detailsLabel.pack(pady=10, padx=10)

class SimulationPage(tk.Frame):
    def __init__(self, parent, controller):
        self.animate = False
        self.controller = controller
        tk.Frame.__init__(self, parent)
        label = tk.Label(self, text="Simulation Page", font=LARGE_FONT)
        label.pack(pady=10, padx=10)

        homeButton = ttk.Button(self, text="Back to Home",
                             command=lambda: self.backToHome())
        homeButton.pack()

        toggleButton = ttk.Button(self, text="Start/Stop",
                             command=lambda: self.startStopButton())
        toggleButton.pack()

        numOfBodiesLabel = tk.Label(self, text="Number of 10-100 Solar Mass Bodies (min 1, max 20)", font=LARGE_FONT)
        numOfBodiesLabel.pack(pady=10, padx=10)
        self.numOfBodies = 1
        numBodies = tk.IntVar()
        self.numberOfBodiesScale = tk.Scale(self,
                                            from_=1,
                                            to=20,
                                            variable=numBodies,
                                            orient=tk.HORIZONTAL,
                                            command=self.changeNumOfBodies)
        self.numberOfBodiesScale.pack()

        resetButton = ttk.Button(self, text="Reset",
                             command=lambda: self.setNBody(reset=True))
        resetButton.pack()
        self.setNBody()

    def animateCanvas(self):

        # initialization function: plot the background of each frame
        def initBody():
            for index, body in enumerate(self.bodylist):
                bodyCoords = self.n.system.bodies[index].getCoordinate()
                body.set_data(bodyCoords[0], bodyCoords[1])
            return self.bodylist

        def initPath():
            for index, path in enumerate(self.pathlist):
                currentPath = self.n.system.bodies[index].path
                path.set_data(currentPath[0], currentPath[1])
            return self.pathlist

        # animation function.  This is called sequentially
        def animateBody(i):
            for index, body in enumerate(self.bodylist):
                bodyCoords = self.n.system.bodies[index].getCoordinate()
                body.set_data(bodyCoords[0], bodyCoords[1])
            return tuple(self.bodylist)

        def animatePath(i):
            if self.animate:
                self.n.iterateMotion()
            for index, path in enumerate(self.pathlist):
                path.set_data(self.n.system.bodies[index].path[0],
                              self.n.system.bodies[index].path[1])
            return tuple(self.pathlist)

        # call the animator.  blit=True means only re-draw the parts that have changed.
        animPath = animation.FuncAnimation(self.fig, animatePath, init_func=initPath, frames=1000,
                                           interval=50, blit=False)
        # call the animator.  blit=True means only re-draw the parts that have changed.
        animBody = animation.FuncAnimation(self.fig, animateBody, init_func=initBody, frames=1000,
                                           interval=50, blit=False)
        plt.grid(b=True, color='#666666', linestyle='-')
        plt.minorticks_on()
        plt.grid(b=True, which='minor', color='#999999', linestyle='-', alpha=0.2)
        self.canvas.draw()

    def startStopButton(self):
        self.animate = ~self.animate

    def backToHome(self):
        if self.animate:
            self.animate = ~self.animate
        self.controller.show_frame(StartPage)

    def setNBody(self, **kwargs):
        if len(kwargs) != 0:
            plt.clf()
            self.canvas.get_tk_widget().destroy()
            self.canvas._tkcanvas.destroy()
        self.fig = plt.figure(1)
        self.canvas = FigureCanvasTkAgg(self.fig, self)
        self.canvas.get_tk_widget().pack(side=tk.BOTTOM, fill=tk.BOTH, expand=True)
        self.canvas._tkcanvas.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        if len(kwargs) == 0:
            self.toolbar = NavigationToolbar2Tk(self.canvas, self)
            self.toolbar.update()
        self.ax = plt.axes(xlim=[-20, 20], ylim=[-20, 20])
        self.n = nBodyProblem(n=self.numOfBodies)
        self.bodylist = []
        for index, body in enumerate(self.n.system.bodies):
            self.bodylist.append(self.ax.plot([], [], 'ko' if index == 0 or index == 1 else 'ro')[0])

        self.pathlist = []
        for index in range(len(self.n.system.bodies)):
            self.pathlist.append(self.ax.plot([], [], lw=1)[0])

        self.animateCanvas()

    def changeNumOfBodies(self, value):
        self.numOfBodies = int(value)

################################################################################
################################################################################
# Define script behavior

if __name__ == '__main__':
    app = nBodyGui()
    app.mainloop()
