# clear-graph-insert-tokens.ru

# Clears a graph and inserts the tokens as the data

CLEAR {{#if graph}}GRAPH <{{{graph}}}>{{else}}DEFAULT{{/if}};

INSERT DATA {
    {{#if graph~}}
        GRAPH <{{{graph}}}>{
    {{~/if}}
    {{#each tokens~}}
        {{{this}}}
    {{~/each}}
    {{#if graph~}}
        }
    {{~/if}}
}
