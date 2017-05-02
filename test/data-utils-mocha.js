// data-utils-mocha.js

var _ = require('underscore');

var chai = require('chai');
var expect = chai.expect;
var should = chai.should();

var fs = require('fs');
var os = require('os');

var dataUtils = require('../components/lib/data-utils');
var test = require('./common-test');

describe("data-utils", function() {

    it("should exist as an object", function() {
        dataUtils.should.exist;
        dataUtils.should.be.an('object');

        // verified expects API is there
        dataUtils.parseData.should.be.a('function');
        dataUtils.readFileData.should.be.a('function');
        dataUtils.readJsonData.should.be.a('function');
    });

    describe("#parseData", function() {
        it("should throw an error if no json data was specified", function() {
            expect(dataUtils.parseData.bind(this)).to.throw(Error,
                "parseData API requires data to parse!");
        });

        it("should throw an error if json data was empty", function() {
            expect(dataUtils.parseData.bind(this, '')).to.throw(Error,
                "parseData API requires data to parse!");
        });

        it("should throw an error if the data was empty, printing component and description", function() {
            var componentName = "TestComponent";
            var description = "test JSON"
            expect(dataUtils.parseData.bind(this, '', componentName, description)).to.throw(Error,
                componentName + " requires " + description + " to parse!");
        });

        it("should throw an error if data is not JSON", function() {
            expect(dataUtils.parseData.bind(this, "Garbage In")).to.throw(Error,
                "parseData API is unable to parse data: Unexpected token G in JSON at position 0!");
        });

        it("should parse JSON", function() {
            var json = { "un" : "uno",
                         "deux" : "dos",
                         "trois" : "tres" };
            expect(dataUtils.parseData(json)).to.deep.equal({ un: 'uno', deux: 'dos', trois: 'tres' });
        });
    });

    describe("#readFileData", function() {

        it("should throw an error if no json data was specified", function() {
            expect(dataUtils.readFileData.bind(this)).to.throw(Error,
                "readFileData API requires a file name!");
        });

        it("should throw an error if json data was empty", function() {
            expect(dataUtils.readFileData.bind(this, '')).to.throw(Error,
                "readFileData API requires a file name!");
        });

        it("should throw an error if the file name  was empty, printing component and description", function() {
            var componentName = "TestComponent";
            var description = "test";
            expect(dataUtils.readFileData.bind(this, '', 'utf-8', componentName, description)).to.throw(Error,
                componentName + " requires a " + description + " file name!");
        });

        it("should return an error if given non-existent file", function() {
            var filepath =  os.tmpdir() + "/wikiwiki" + Math.random() + ".json"
            try { 
                dataUtils.readFileData(filepath, 'utf-8', 'Test Component'); 
            } catch(e) { 
                e.message.should.contain('Test Component is unable to read file');
            }
        });

        it("should read a file and return contents", function () {
            var filepath =  os.tmpdir() + "/wikiwiki" + Math.random() + ".json"
            var content = "I think that I shall never see\n A poem lovely as a tree.";
            fs.writeFileSync(filepath, content);

            expect(dataUtils.readFileData(filepath, 'utf-8', 'Test Component')).to.equal(content); 
            fs.unlinkSync(filepath);
        });
    });

    describe("#readJsonData", function() {
        it("should throw an error if no json data was specified", function() {
            expect(dataUtils.readJsonData.bind(this)).to.throw(Error,
                "readJsonData API requires a file name!");
        });

        it("should throw an error if json data was empty", function() {
            expect(dataUtils.readJsonData.bind(this, '')).to.throw(Error,
                "readJsonData API requires a file name!");
        });

        it("should throw an error if the file name was empty, printing component and description", function() {
            var componentName = "TestComponent";
            var description = "test";
            expect(dataUtils.readJsonData.bind(this, '', 'utf-8', componentName, description)).to.throw(Error,
                componentName + " requires a " + description + " file name!");
        });

        it("should throw an error if the file could not be parsed, printing component and description", function() {
            var componentName = "TestComponent";
            var description = "test file";

            var filepath =  os.tmpdir() + "/wikiwiki" + Math.random() + ".json"
            var content = "What's up, JSON?";
            fs.writeFileSync(filepath, content);

            expect(dataUtils.readJsonData.bind(this, filepath, 'utf-8', componentName, description)).to.throw(Error,
                componentName + " is unable to parse " + description + ": Unexpected token W in JSON at position 0!");
            fs.unlinkSync(filepath);
        });

        it("should read and parse a JSON file and return the JSON", function () {
            var filepath =  os.tmpdir() + "/wikiwiki" + Math.random() + ".json"
            var content = {
              plants: {
                bulb: "tulip",
                corm: "anemone",
                seed: "forget-me-not",
                tuber: "dahlia"
               },
               animals: {
                 kitten: "cat",
                 puppy: "dog"
               }
            };
            fs.writeFileSync(filepath, JSON.stringify(content));

            expect(dataUtils.readJsonData(filepath, 'utf-8', 'Test Component')).to.deep.equal(content); 
            fs.unlinkSync(filepath);
        });

    });
});
