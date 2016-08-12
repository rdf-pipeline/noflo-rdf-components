// confluence-mocha.js

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var sinon = require('sinon');

var fs = require('fs');

var test = require('./common-test');
var factory = require('../components/confluence');
var stateFactory = require('../src/create-state');
var logger = require('../src/logger');

describe('confluence', function() {

    it('should exist as a function', function() {
        factory.should.exist;
        factory.should.be.a('function');
    });

    it('should instantiate a noflo component', function() {
        var node = test.createComponent(factory);
        node.should.be.an('object');
        node.should.include.keys('nodeName', 'componentName', 'outPorts', 'inPorts', 'vni', 'vnis');
    });

    describe('#updater', function() {

        it("should throw an error if no arguments specified", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''))).to.throw(Error,
                   /Confluence requires a hash to synchronize the inputs!/);
        });

        it("should warn if metadata key is not defined and default to patientId", function(done) {

            var node = test.createComponent(factory);
            var hash = {1:"one"};
            var vni = node.vni('');
            vni.inputStates({'hash': stateFactory('', hash),
                             'input': stateFactory('', 'one')});
            stateFactory.addMetadata(vni.inputStates('hash'), {patientId: 1});
            stateFactory.addMetadata(vni.inputStates('input'), {patientId: 1});
            sinon.stub(logger,'warn', function(message) { 
                logger.warn.restore(); 
                message.should.equal("No metadata key found; defaulting metadata key to patientId.");
                done(); 
            });
	    var result = factory.updater.call(node.vni(''), hash, "one", undefined);
        });

        it("should warn if metadata key is not a string", function(done) {
            var node = test.createComponent(factory);
            var hash = {1:"one"};
            var vni = node.vni('');
            vni.inputStates({'hash': stateFactory('', hash),
                             'input': stateFactory('', 'one')});
            stateFactory.addMetadata(vni.inputStates('hash'), {patientId: 1});
            stateFactory.addMetadata(vni.inputStates('input'), {patientId: 1});
            sinon.stub(logger,'warn', function(message) { 
                logger.warn.restore(); 
                message.should.equal("No metadata key found; defaulting metadata key to patientId.");
                done(); 
            });
	    var result = factory.updater.call(node.vni(''), {"1":"one"}, "one", {key: 'keyname'});
	    });

        it("should throw an error if hash is undefined", function() {
            var node = test.createComponent(factory);
            expect(factory.updater.bind(node.vni(''), undefined, '1', 'id')).to.throw(Error,
                   /Confluence requires a hash to synchronize the inputs!/);
        });

        it("should throw an error if the hash key was undefined", function() {
            var node = test.createComponent(factory);
            var hash = {1:"one"};
            var vni = node.vni('');
            vni.inputStates({'hash': stateFactory('', hash),
                             'input': stateFactory('', 'one')});
            expect(factory.updater.bind(node.vni(''), hash, 'one', 'id')).to.throw(Error,
                   /Confluence requires a metadata key on the hash VNI to identify the task set being processed!/);
        });

        it("should throw an error if the input key was undefined", function() {
            var node = test.createComponent(factory);
            var hash = {1:"ringo"};
            var input = 'ringo';
            node.vni('').inputStates({'hash': stateFactory('', hash),
                                      'input': stateFactory('', input)});
            sinon.stub(logger, 'warn');
            stateFactory.addMetadata(node.vni('').inputStates('hash'), 
                                     {patientId: 1});
            expect(factory.updater.bind(node.vni(''), hash, input)).to.throw(Error,
                   /Confluence requires a metadata key on the input VNI to identify the completed task!/);
            logger.warn.restore();
        });

        it('should match one element hash with task and return result', function() {
            var node = test.createComponent(factory);

            var hash = {1:"ringo"};
            var input = 'ringo is done';

            var vni = node.vni('');
            vni.inputStates({'metadata_key': stateFactory('', 'id'),
                             'hash': stateFactory('', hash),
                             'input': stateFactory('1', input)});
            stateFactory.addMetadata(vni.inputStates('hash'), {id: 123});
            stateFactory.addMetadata(vni.inputStates('input'), {id: 123});

            var result = factory.updater.call(vni, hash, input, 'id');

            result.should.equal('Completed processing 123');
        });

        it('should match a multi element hash with task on default VNI and return result', function() {
            var node = test.createComponent(factory);

            var hash = { 1:"ringo",
                         2: "paul",
                         3: "john",
                         4: "george" };

            var ringo = "ringo is done";
            var paul = "paul is done";
            var john = "john is done";
            var george = "george is done";

            var vni = node.vni('');
            vni.inputStates({'metadata_key': stateFactory('', 'id'),
                             'hash': stateFactory('', hash),
                             'input': stateFactory('1', ringo)});
            stateFactory.addMetadata(vni.inputStates('hash'), {id: 'Abbey-Rd-1'});
            stateFactory.addMetadata(vni.inputStates('input'), {id: 'Abbey-Rd-1'});

            // Complete ringo
            var result = factory.updater.call(vni, hash, ringo, 'id');
            expect(result).to.be.undefined;

            // Complete John (deliberately out of order in hash)
            vni.inputStates({'input': stateFactory('3', john)});
            result = factory.updater.call(vni, hash, john, 'id');
            expect(result).to.be.undefined;

            // Complete George 
            vni.inputStates({'input': stateFactory('4', george)});
            result = factory.updater.call(vni, hash, george, 'id');
            expect(result).to.be.undefined;

            // Complete Paul 
            vni.inputStates({'input': stateFactory('2', paul)});
            result = factory.updater.call(vni,  hash, paul, 'id');
            result.should.equal('Completed processing Abbey-Rd-1');

        });

        it('should match a multi element hash with task on different VNIs and return result', function() {
            var node = test.createComponent(factory);

            var hash = {1: {first: "dan", last: "reynolds", job: "vocals"},
                        2: {first: "wayne", last: "sermon", job: "guitar"},
                        3: {first: "ben", last: "mckee", job: "bass"},
                        4: {first: "daniel", last: "platzman", job: "drums"}};

            var dan = "dan is done";
            var wayne = "wayne is done";
            var ben = "ben is done";
            var daniel = "daniel is done";
            var id = 'Imagine-Dragons-0';

            var default_vni = node.vni('');
            default_vni.inputStates({'metadata_key': stateFactory('', 'id'),
                                     'hash': stateFactory('', hash)});
            stateFactory.addMetadata(default_vni.inputStates('hash'), 
                                     {id: id});


            var daniel_vni = node.vni('daniel');
            daniel_vni.inputStates({'input': stateFactory('4', daniel)});
            stateFactory.addMetadata(daniel_vni.inputStates('input'), {id: id});
            var result = factory.updater.call(daniel_vni, hash, daniel, 'id');
            expect(result).to.be.undefined;

            var ben_vni = node.vni('ben');
            ben_vni.inputStates({'input': stateFactory('3', ben)});
            stateFactory.addMetadata(ben_vni.inputStates('input'), {id: id});
            result = factory.updater.call(ben_vni, hash, ben, 'id');
            expect(result).to.be.undefined;

            var dan_vni = node.vni('dan');
            dan_vni.inputStates({'input': stateFactory('1', dan)});
            stateFactory.addMetadata(dan_vni.inputStates('input'), {id: id});
            result = factory.updater.call(dan_vni, hash, dan, 'id');
            expect(result).to.be.undefined;

            var wayne_vni = node.vni('wayne');
            wayne_vni.inputStates({'input': stateFactory('2', wayne)});
            stateFactory.addMetadata(wayne_vni.inputStates('input'), {id: id});
            var result = factory.updater.call(wayne_vni, hash, wayne, 'id');
            result.should.equal('Completed processing Imagine-Dragons-0');

        });

        it('should process two hashes in sequence', function() {
            var node = test.createComponent(factory);

            var hash1 = {1: {first: "paul", last: "simon"},
                         2: {first: "art", last: "garfunkel"}};
            var paul = "paul solo";
            var art = "art solo";
            var id1 = "Simon & Garfunkel";

            var hash2 = {1: {first: "josh", last: "dun"},
                         2: {first: "tyler", last: "joseph"}};
            var josh = "josh out";
            var tyler = "tyler out";
            var id2 = 'Twenty-One Pilots';

            var default_vni = node.vni('');


            // First hash
            default_vni.inputStates({'metadata_key': stateFactory('', 'id'),
                                     'hash': stateFactory('', hash1)});
            stateFactory.addMetadata(default_vni.inputStates('hash'), 
                                     {id: id1});

            var paul_vni = node.vni('paul');
            paul_vni.inputStates({'input': stateFactory('1', paul)});
            stateFactory.addMetadata(paul_vni.inputStates('input'), {id: id1});
            var result = factory.updater.call(paul_vni, hash1, paul, 'id');
            expect(result).to.be.undefined;

            var art_vni = node.vni('art');
            art_vni.inputStates({'input': stateFactory('2', art)});
            stateFactory.addMetadata(art_vni.inputStates('input'), {id: id1});
            result = factory.updater.call(art_vni, hash1, art, 'id');
            result.should.equal('Completed processing Simon & Garfunkel');

            // Now the second hash
            default_vni.inputStates({'metadata_key': stateFactory('', 'id'),
                                     'hash': stateFactory('', hash2)});
            stateFactory.addMetadata(default_vni.inputStates('hash'), 
                                     {id: id2});

            var josh_vni = node.vni('josh');
            josh_vni.inputStates({'input': stateFactory('1', josh)});
            stateFactory.addMetadata(josh_vni.inputStates('input'), {id: id2});
            result = factory.updater.call(josh_vni, hash2, josh, 'id');
            expect(result).to.be.undefined;
        
            var tyler_vni = node.vni('tyler');
            tyler_vni.inputStates({'input': stateFactory('2', tyler)});
            stateFactory.addMetadata(tyler_vni.inputStates('input'), {id: id2});
            result = factory.updater.call(tyler_vni, hash2, tyler, 'id');
            result.should.equal('Completed processing Twenty-One Pilots');

        });

        it('should throw an error if it receives a second hash before first is finished', function() {
            var node = test.createComponent(factory);

            var hash1 = {1: {first: "paul", last: "simon"},
                         2: {first: "art", last: "garfunkel"}};
            var paul = "paul solo";
            var art = "art solo";
            var id1 = "Simon & Garfunkel";

            var hash2 = {1: {first: "josh", last: "dun"},
                         2: {first: "tyler", last: "joseph"}};
            var josh = "josh out";
            var tyler = "tyler out";
            var id2 = 'Twenty-One Pilots';


            var default_vni = node.vni('');
            default_vni.inputStates({'metadata_key': stateFactory('', 'id'),
                                     'hash': stateFactory('', hash1)});
            stateFactory.addMetadata(default_vni.inputStates('hash'), 
                                     {id: id1});

            var paul_vni = node.vni('paul');
            paul_vni.inputStates({'input': stateFactory('1', paul)});
            stateFactory.addMetadata(paul_vni.inputStates('input'), {id: id1});
            var result = factory.updater.call(paul_vni, hash1, paul, 'id');
            expect(result).to.be.undefined;

            // Now send a new hash, even though first is not done yet
            default_vni.inputStates({'metadata_key': stateFactory('', 'id'),
                                     'hash': stateFactory('', hash2)});
            stateFactory.addMetadata(default_vni.inputStates('hash'), 
                                     {id: id2});

            var josh_vni = node.vni('josh');
            josh_vni.inputStates({'input': stateFactory('1', josh)});
            stateFactory.addMetadata(josh_vni.inputStates('input'), {id: id2});
	    expect(factory.updater.bind(josh_vni, hash2, josh, 'id')).to.throw(Error,
	           /Confluence received a new hash before the last one was finished!/);

        });

    });

    describe('functional behavior', function() {

        it('should run in a noflo network', function() {

            var testFile = __dirname + '/data/cmumps-patient7.jsonld';
            var data = fs.readFileSync(testFile);
            var parsedData = JSON.parse(data); // readfile gives us a json object, so parse it

            return test.createNetwork(
                 { filedata: 'core/Repeat',
                   translators: 'core/Repeat',
                   patientHashNode: 'rdf-components/patient-hash',
                   demographicsNode: 'rdf-components/translate-demographics-cmumps2fhir',
                   prescriptionsNode: 'rdf-components/translate-prescription-cmumps2fhir',
                   confluence: 'rdf-components/confluence'}

           ).then(function(network) {
                var confluence = network.processes.confluence.component;

                return new Promise(function(done, fail) {

                    test.onOutPortData(confluence, 'output', done);
        
                    network.graph.addEdge('filedata', 'out', 'patientHashNode', 'patient_json');
                    network.graph.addEdge('translators', 'out', 'patientHashNode', 'translator_components');

                    network.graph.addEdge('patientHashNode', 'output', 'demographicsNode', 'input');
                    network.graph.addEdge('patientHashNode', 'output', 'prescriptionsNode', 'input');

                    network.graph.addEdge('patientHashNode', 'output', 'confluence', 'hash');
                    network.graph.addEdge('demographicsNode', 'output', 'confluence', 'input');
                    network.graph.addEdge('prescriptionsNode', 'output', 'confluence', 'input');

                    sinon.stub(logger, 'warn');
                    network.graph.addInitial( {demographics: 'rdf-components/translate-demographics-cmumps2fhir',
                                               prescription: 'rdf-components/translate-prescription-cmumps2fhir'}, 
                                              'translators', 'in');
                    network.graph.addInitial(parsedData, 'filedata', 'in');
                    network.graph.addInitial('patientId', 'confluence', 'metadata_key');


                }).then(function(done) {
                    logger.warn.restore();
                    done.should.be.an('object');
                    done.data.should.equal('Completed processing 2-000007');
                    done.patientId.should.equal('2-000007'); 
                }, function(fail) {
                    logger.warn.restore();
                    console.error(fail);
                    throw Error(fail);
                }); 
            }); 
        });

    });
});
