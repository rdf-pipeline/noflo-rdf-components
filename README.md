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

Then run the noflo-server

    $ noflo-server


