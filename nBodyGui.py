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

        for F in (StartPage, PageOne, PageTwo, PageThree):
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

        button = ttk.Button(self, text="Two Body System",
                            command=lambda: controller.show_frame(PageOne))
        button.pack()

        button2 = ttk.Button(self, text="Three Body System",
                             command=lambda: controller.show_frame(PageTwo))
        button2.pack()

        button3 = ttk.Button(self, text="Large Central Mass System",
                             command=lambda: controller.show_frame(PageThree))
        button3.pack()


class PageOne(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent)
        label = tk.Label(self, text="Two Body System", font=LARGE_FONT)
        label.pack(pady=10, padx=10)

        button1 = ttk.Button(self, text="Back to Home",
                             command=lambda: controller.show_frame(StartPage))
        button1.pack()

        button2 = ttk.Button(self, text="Three Body System",
                             command=lambda: controller.show_frame(PageTwo))
        button2.pack()

        button3 = ttk.Button(self, text="Large Central Mass System",
                             command=lambda: controller.show_frame(PageThree))
        button3.pack()


class PageTwo(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent)
        label = tk.Label(self, text="Three Body System", font=LARGE_FONT)
        label.pack(pady=10, padx=10)

        button1 = ttk.Button(self, text="Back to Home",
                             command=lambda: controller.show_frame(StartPage))
        button1.pack()

        button2 = ttk.Button(self, text="Two Body System",
                             command=lambda: controller.show_frame(PageOne))
        button2.pack()

        button3 = ttk.Button(self, text="Large Central Mass System",
                             command=lambda: controller.show_frame(PageThree))
        button3.pack()


class PageThree(tk.Frame):
    def __init__(self, parent, controller):
        tk.Frame.__init__(self, parent)
        label = tk.Label(self, text="Large Central Mass System", font=LARGE_FONT)
        label.pack(pady=10, padx=10)

        button1 = ttk.Button(self, text="Back to Home",
                             command=lambda: controller.show_frame(StartPage))
        button1.pack()

        n = nBodyProblem(n=20)

        fig = plt.figure()
        ax = plt.axes(xlim=[-2, 2], ylim=[-2, 2])

        bodylist = []
        for index, body in enumerate(n.system.bodies):
            bodylist.append(ax.plot([], [], 'ko' if index == 0 else 'ro')[0])

        pathlist = []
        for index in range(len(n.system.bodies)):
            pathlist.append(ax.plot([], [], lw=1)[0])

        # initialization function: plot the background of each frame
        def initBody():
            for index, body in enumerate(bodylist):
                bodyCoords = n.system.bodies[index].getCoordinate()
                body.set_data(bodyCoords[0], bodyCoords[1])
            return bodylist

        def initPath():
            for index, path in enumerate(pathlist):
                currentPath = n.system.bodies[index].path
                path.set_data(currentPath[0], currentPath[1])
            return pathlist

        # animation function.  This is called sequentially
        def animateBody(i):
            for index, body in enumerate(bodylist):
                bodyCoords = n.system.bodies[index].getCoordinate()
                body.set_data(bodyCoords[0], bodyCoords[1])
            return tuple(bodylist)

        def animatePath(i):
            n.iterateMotion()
            for index, path in enumerate(pathlist):
                path.set_data(n.system.bodies[index].path[0],
                              n.system.bodies[index].path[1])
            return tuple(pathlist)

        canvas = FigureCanvasTkAgg(fig, self)
        canvas.get_tk_widget().pack(side=tk.BOTTOM, fill=tk.BOTH, expand=True)

        toolbar = NavigationToolbar2Tk(canvas, self)
        toolbar.update()
        canvas._tkcanvas.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # call the animator.  blit=True means only re-draw the parts that have changed.
        animPath = animation.FuncAnimation(fig, animatePath, init_func=initPath, frames=1000,
                                           interval=50, blit=False)
        # call the animator.  blit=True means only re-draw the parts that have changed.
        animBody = animation.FuncAnimation(fig, animateBody, init_func=initBody, frames=1000,
                                           interval=50, blit=False)

        canvas.draw()

################################################################################
################################################################################
# Define script behavior

if __name__ == '__main__':
    app = nBodyGui()
    app.mainloop()
