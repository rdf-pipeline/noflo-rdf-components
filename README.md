# noflo-rdf-components
NoFlo components for processing RDF related content

## Development

To manually run these components in a UI, perform the following.

Register this project globally

    noflo-rdf-components$ npm link

Checkout noflo-server

    $ git clone https://github.com/rdf-pipeline/noflo-server.git

From the noflo-server project directory run:

    noflo-server$ npm link noflo-rdf-components

Add the noflo-server to the local path:

    noflo-server$ npm link

Then run the noflo-server, choosing whatever unused port you want
instead of 8097:

    $ noflo-server --port 8097

NoFlo UI is then available in your browser at http://localhost:8097/

## Testing 

For testing, we are using the [Mocha library](https://mochajs.org/) with the [Chai assertion library](http://chaijs.com/), and [Sinon.JS](http://sinonjs.org/) spies and stubs.  We are using the Istanbul library to track code coverage. 

To get started the first time, install mocha and Istanbul if you have not already done so: 
    
    sudo npm install -g mocha
    sudo npm install -g istanbul

Next, check out the noflo-rdf-components repository and install its dependent components: 
    
    git clone https://github.com/rdf-pipeline/noflo-rdf-components.git
    cd noflo-rdf-components
    npm install 

At this point, you are ready to run mocha: 
    
    cd noflo-rdf-components
    mocha

This should execute the current test suite of tests, located in the noflo-rdf-components/tests directory. To run a single test: 
    
    mocha test/<test file>

To see the code coverage of the tests, run Istanbul and bring the results up in your preferred browser: 
       
    cd noflo-rdf-components
    istanbul cover _mocha -- -R spec
    open coverage/lcov-report/index.html 

For documentation on writing tests, please refer to the [noflo-rdf-pipeline developer testing wiki](https://github.com/rdf-pipeline/noflo-rdf-pipeline/wiki/Developer-Testing).
