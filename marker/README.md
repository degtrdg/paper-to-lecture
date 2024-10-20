Introduction
Modal is a cloud function platform that lets you:

Run any code remotely within seconds.
Define container environments in code (or use one of our pre-built backends).
Scale out horizontally to thousands of containers.
Attach GPUs with a single line of code.
Serve your functions as web endpoints.
Deploy and monitor persistent scheduled jobs.
Use powerful primitives like distributed dictionaries and queues.
You get full serverless execution and pricing, because we host everything and charge per second of usage. Notably, there’s zero configuration in Modal - everything is code. Take a breath of fresh air and feel how good it tastes with no YAML in it.

Getting started
The nicest thing about all of this is that you don’t have to set up any infrastructure. Just:

Create an account at modal.com
Run pip install modal to install the modal Python package
Run modal setup to authenticate (if this doesn’t work, try python -m modal setup)
…and you can start running jobs right away. Check out some of our simple getting started examples:

Hello, world!
A simple web scraper
You can also learn Modal interactively without installing anything through our code playground.

How does it work?
Modal takes your code, puts it in a container, and executes it in the cloud.

Where does it run? Modal runs it in its own cloud environment. The benefit is that we solve all the hard infrastructure problems for you, so you don’t have to do anything. You don’t need to mess with Kubernetes, Docker or even an AWS account.

Modal is currently Python-only, but we may support other languages in the future.

Hello, world!
This tutorial demonstrates some core features of Modal:

You can run functions on Modal just as easily as you run them locally.
Running functions in parallel on Modal is simple and fast.
Logs and errors show up immediately, even for functions running on Modal.
Importing Modal and setting up
We start by importing modal and creating a App. We build up this App to define our application.

import sys

import modal

app = modal.App("example-hello-world")

Copy
Defining a function
Modal takes code and runs it in the cloud.

So first we’ve got to write some code.

Let’s write a simple function that takes in an input, prints a log or an error to the console, and then returns an output.

To make this function work with Modal, we just wrap it in a decorator, @app.function.

@app.function()
def f(i):
    if i % 2 == 0:
        print("hello", i)
    else:
        print("world", i, file=sys.stderr)

    return i * i

Copy
Running our function locally, remotely, and in parallel
Now let’s see three different ways we can call that function:

As a regular call on your local machine, with f.local

As a remote call that runs in the cloud, with f.remote

By mapping many copies of f in the cloud over many inputs, with f.map

We call f in each of these ways inside the main function below.

@app.local_entrypoint()
def main():
    # run the function locally
    print(f.local(1000))

    # run the function remotely on Modal
    print(f.remote(1000))

    # run the function in parallel and remotely on Modal
    total = 0
    for ret in f.map(range(200)):
        total += ret

    print(total)

Copy
Enter modal run hello_world.py in a shell, and you’ll see a Modal app initialize. You’ll then see the printed logs of the main function and, mixed in with them, all the logs of f as it is run locally, then remotely, and then remotely and in parallel.

That’s all triggered by adding the @app.local_entrypoint decorator on main, which defines it as the function to start from locally when we invoke modal run.

What just happened?
When we called .remote on f, the function was executed in the cloud, on Modal’s infrastructure, not on the local machine.

In short, we took the function f, put it inside a container, sent it the inputs, and streamed back the logs and outputs.

But why does this matter?
Try one of these things next to start seeing the full power of Modal!

You can change the code and run it again
For instance, change the print statement in the function f to print "spam" and "eggs" instead and run the app again. You’ll see that that your new code is run with no extra work from you — and it should even run faster!

Modal’s goal is to make running code in the cloud feel like you’re running code locally. That means no waiting for long image builds when you’ve just moved a comma, no fiddling with container image pushes, and no context-switching to a web UI to inspect logs.

You can map over more data
Change the map range from 200 to some large number, like 1170. You’ll see Modal create and run even more containers in parallel this time.

And it’ll happen lightning fast!

You can run a more interesting function
The function f is a bit silly and doesn’t do much, but in its place imagine something that matters to you, like:

Running language model inference or fine-tuning
Manipulating audio or images
Collecting financial data to backtest a trading algorithm
Modal lets you parallelize that operation effortlessly by running hundreds or thousands of containers in the cloud.

A simple web scraper
In this guide we’ll introduce you to Modal by writing a simple web scraper. We’ll explain the foundations of a Modal application step by step.

Set up your first Modal app
Modal apps are orchestrated as Python scripts, but can theoretically run anything you can run in a container. To get you started, make sure to install the latest Modal Python package and set up an API token (the first two steps of the Getting started page).

Finding links
First, we create an empty Python file scrape.py. This file will contain our application code. Lets write some basic Python code to fetch the contents of a web page and print the links (href attributes) it finds in the document:

import re
import sys
import urllib.request


def get_links(url):
    response = urllib.request.urlopen(url)
    html = response.read().decode("utf8")
    links = []
    for match in re.finditer('href="(.*?)"', html):
        links.append(match.group(1))
    return links


if __name__ == "__main__":
    links = get_links(sys.argv[1])
    print(links)

Copy
Now obviously this is just pure standard library Python code, and you can run it on your machine:

$ python scrape.py http://example.com
['https://www.iana.org/domains/example']

Copy
Running it in Modal
To make the get_links function run in Modal instead of your local machine, all you need to do is

Import modal
Create a modal.App instance
Add a @app.function() annotation to your function
Replace the if __name__ == "__main__": block with a function decorated with @app.local_entrypoint()
Call get_links using get_links.remote
import re
import urllib.request
import modal

app = modal.App(name="link-scraper")


@app.function()
def get_links(url):
    ...


@app.local_entrypoint()
def main(url):
    links = get_links.remote(url)
    print(links)

Copy
You can now run this with the Modal CLI, using modal run instead of python. This time, you’ll see additional progress indicators while the script is running:

$ modal run scrape.py --url http://example.com
✓ Initialized.
✓ Created objects.
['https://www.iana.org/domains/example']
✓ App completed.

Copy
Custom containers
In the code above we make use of the Python standard library urllib library. This works great for static web pages, but many pages these days use javascript to dynamically load content, which wouldn’t appear in the loaded html file. Let’s use the Playwright package to instead launch a headless Chromium browser which can interpret any javascript that might be on the page.

We can pass custom container images (defined using modal.Image) to the @app.function() decorator. We’ll make use of the modal.Image.debian_slim pre-bundled image add the shell commands to install Playwright and its dependencies:

playwright_image = modal.Image.debian_slim(python_version="3.10").run_commands(
    "apt-get update",
    "apt-get install -y software-properties-common",
    "apt-add-repository non-free",
    "apt-add-repository contrib",
    "pip install playwright==1.30.0",
    "playwright install-deps chromium",
    "playwright install chromium",
)

Copy
Note that we don’t have to install Playwright or Chromium on our development machine since this will all run in Modal. We can now modify our get_links function to make use of the new tools:

@app.function(image=playwright_image)
async def get_links(cur_url: str):
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto(cur_url)
        links = await page.eval_on_selector_all("a[href]", "elements => elements.map(element => element.href)")
        await browser.close()

    print("Links", links)
    return links

Copy
Since Playwright has a nice async interface, we’ll redeclare our get_links function as async (Modal works with both sync and async functions).

The first time you run the function after making this change, you’ll notice that the output first shows the progress of building the custom image you specified, after which your function runs like before. This image is then cached so that on subsequent runs of the function it will not be rebuilt as long as the image definition is the same.

Scaling out
So far, our script only fetches the links for a single page. What if we want to scrape a large list of links in parallel?

We can do this easily with Modal, because of some magic: the function we wrapped with the @app.function() decorator is no longer an ordinary function, but a Modal Function object. This means it comes with a map property built in, that lets us run this function for all inputs in parallel, scaling up to as many workers as needed.

Let’s change our code to scrape all urls we feed to it in parallel:

@app.local_entrypoint()
def main():
    urls = ["http://modal.com", "http://github.com"]
    for links in get_links.map(urls):
        for link in links:
            print(link)

Copy
Schedules and deployments
Let’s say we want to log the scraped links daily. We move the print loop into its own Modal function and annotate it with a modal.Period(days=1) schedule - indicating we want to run it once per day. Since the scheduled function will not run from our command line, we also add a hard-coded list of links to crawl for now. In a more realistic setting we could read this from a database or other accessible data source.

@app.function(schedule=modal.Period(days=1))
def daily_scrape():
    urls = ["http://modal.com", "http://github.com"]
    for links in get_links.map(urls):
        for link in links:
            print(link)

Copy
To deploy this as a permanent app, run the command

modal deploy scrape.py

Copy
Running this command deploys this function and then closes immediately. We can see the deployment and all of its runs, including the printed links, on the Modal Apps page. Rerunning the script will redeploy the code with any changes you have made - overwriting an existing deploy with the same name (“link-scraper” in this case).

Integrations and Secrets
Instead of looking at the links in the run logs of our deployments, let’s say we wanted to post them to our #scraped-links Slack channel. To do this, we can make use of the Slack API and the slack-sdk PyPI package.

The Slack SDK WebClient requires an API token to get access to our Slack Workspace, and since it’s bad practice to hardcode credentials into application code we make use of Modal’s Secrets. Secrets are snippets of data that will be injected as environment variables in the containers running your functions.

The easiest way to create Secrets is to go to the Secrets section of modal.com. You can both create a free-form secret with any environment variables, or make use of presets for common services. We’ll use the Slack preset and after filling in the necessary information we are presented with a snippet of code that can be used to post to Slack using our credentials:

import os
slack_sdk_image = modal.Image.debian_slim().pip_install("slack-sdk")


@app.function(image=slack_sdk_image, secrets=[modal.Secret.from_name("my-slack-secret")])
def bot_token_msg(channel, message):
    import slack_sdk
    client = slack_sdk.WebClient(token=os.environ["SLACK_BOT_TOKEN"])
    client.chat_postMessage(channel=channel, text=message)

Copy
Copy that code as-is, then amend the daily_scrape function to call bot_token_msg.

@app.function(schedule=modal.Period(days=1))
def daily_scrape():
    urls = ["http://modal.com", "http://github.com"]
    for links in get_links.map(urls):
        for link in links:
            bot_token_msg.remote("scraped-links", link)


Note that we are freely making function calls across completely different container images, as if they were regular Python functions in the same program.

We rerun the script which overwrites the old deploy with our updated code, and now we get a daily feed of our scraped links in our Slack channel 🎉

Summary
We have shown how you can use Modal to develop distributed Python data applications using custom containers. Through simple constructs we were able to add parallel execution. With the change of a single line of code were were able to go from experimental development code to a deployed application. The full code of this example can be found here. We hope this overview gives you a glimpse of what you are able to build using Modal.

File and project structure
Apps spanning multiple files
If you have a project spanning multiple files, you can either use a single Modal App to create Modal resources across all of them or compose multiple apps using app.include(other_app) into a single app at deploy time.

In this guide we’ll show you how to use composition of multiple smaller files with their own “apps” in order to cleanly separate different parts of your app into multiple files. You can see a realistic instance of a single app use in our LLM + TTS example.

Assume we have a package named pkg with files a.py and b.py that contain functions we want to deploy:

pkg/
├── __init__.py
├── a.py
└── b.py


# pkg/a.py
a_app = modal.App("a")
image_1 = modal.Image.debian_slim().pip_install("some_package")

@a_app.function(image=image_1)
def f():
    ...


# pkg/b.py
b_app = modal.App("b")
image_2 = modal.Image.debian_slim().pip_install("other_package")

@b_app.function(image=image_2)
def g():
    ...


To deploy these resources together, make a single deployment file, perhaps deploy.py (the name itself doesn’t matter), that imports the apps from each of the sub-modules and includes them in a common parent app that represents your entire app:

# pkg/deploy.py
from .a import a_app
from .b import b_app

app = modal.App("multi-file-app")
app.include(a_app)
app.include(b_app)


Now you can deploy your app by running modal deploy pkg.deploy from above the pkg directory. Your deployed Modal app will have both the f and g functions.

The final file structure now looks like this:

pkg/
├── __init__.py
├── a.py
├── b.py
└── deploy.py


One advantage of splitting up apps this way is that you can opt to run only part of your larger app during development. For example, running modal run a.py to test some functionality in that part without having to process any changes to the rest of the app.

Tip: you can also make __init__.py your deployment file, which makes deploying a package slightly more convenient. With this, you can deploy your entire project using just modal deploy pkg.

Note: Since the multi-file app still has a single namespace for all functions, it’s important to name your Modal functions uniquely across the project even when splitting it up across files - otherwise you risk some functions “shadowing” others with the same name.