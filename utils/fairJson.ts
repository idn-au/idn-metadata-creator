import type { ScoreDefObj } from "~/types";

const fairRules: ScoreDefObj = {
    f: {
        title: "Findable",
        description: "Metadata and data should be easy to find for both humans and computers.",
        scores: {
            f1: {
                title: "F1",
                description: "(Meta)data are assigned a globally unique and persistent identifier",
                requirements: [
                    {
                        value: 1,
                        description: "Metadata has an identifier",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                    {
                        value: 1,
                        description: "Metadata identifier is a URL",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                    {
                        value: 3,
                        description: "Metadata identifier is globally unique, citable and persistent",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                ],
            },
            f2: {
                title: "F2",
                description: "Data are described with rich metadata",
                requirements: [
                    {
                        value: 1,
                        description: "Resource title and description is included",
                        query: `ASK {
                                    #iri# dcterms:title ?title ;
                                        dcterms:description ?desc .
                                }`,
                    },
                    {
                        value: 1,
                        description: "Additional descriptive properties are present",
                        query: `ASK { #iri# dcterms:type|dcat:theme ?o }`,
                    },
                    {
                        value: 2,
                        description: "All recommended descriptive properties are present",
                        query: `ASK {
                                    #iri# dcterms:type ?indigeneity ;
                                        dcat:theme ?theme .
                                }`,
                    },
                ],
            },
            f3: {
                title: "F3",
                description: "Metadata clearly and explicitly include the identifier of the data they describe",
                requirements: [
                    {
                        value: 2,
                        description: "Distribution information is included as a resolvable URL",
                        query: `ASK {
                                    #iri# dcat:distribution ?dist .
                                    ?dist dcat:accessURL ?url .
                                }`,
                    },
                ],
            },
            f4: {
                title: "F4",
                description: "(Meta)data are registered or indexed in a searchable resource",
                requirements: [
                    {
                        value: 2,
                        description: "Data is described in a repository",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                    {
                        value: 2,
                        description: "Data is discoverable through several registries",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                ],
            },
        },
    },
    a: {
        title: "Accessible",
        description: "Once data is found, access information needs to be clearly indicated on the metadata.",
        scores: {
            a1: {
                title: "A1",
                description: "(Meta)data are retrievable by their identifier using a standardised communications protocol",
                scores: {
                    "a1.1": {
                        title: "A1.1",
                        description: "The protocol is open, free, and universally implementable",
                        requirements: [
                            {
                                value: 3,
                                description: "F1 >= 2 AND Access Rights exist",
                                conditions: [
                                    {
                                        title: "F1 >= 2",
                                        key: "f1",
                                        value: 2,
                                    },
                                ],
                                query: `ASK { #iri# dcterms:accessRights ?accessRights }`,
                            },
                            {
                                value: 1,
                                description: "Access Rights are open",
                                query: `ASK { #iri# dcterms:accessRights <https://linked.data.gov.au/def/data-access-rights/open> }`,
                            },
                        ],
                    },
                    "a1.2": {
                        title: "A1.2",
                        description: "The protocol allows for an authentication and authorisation procedure, where necessary",
                        requirements: [
                            {
                                value: 3,
                                description: "F3 = 2 AND Access Rights exist",
                                conditions: [
                                    {
                                        title: "F3 = 2",
                                        key: "f3",
                                        value: 2,
                                    },
                                ],
                                query: `ASK {
                                            #iri# dcterms:accessRights ?accessRights ;
                                                dcat:distribution ?dist .
                                            ?dist dcat:accessURL ?url .
                                        }`,
                            },
                        ],
                    },
                },
            },
            a2: {
                title: "A2",
                description: "Metadata are accessible, even when the data are no longer available",
                requirements: [
                    {
                        value: 3,
                        description: "Under the archive policy, the metadata record will be available even if the data/resource is no longer available",
                        query: `ASK {
                                    #iri# prov:wasInfluencedBy ?policy .
                                    ?policy sdo:additionalType <https://data.idnau.org/pid/vocab/policy-types/data-policy> .
                                }`,
                    },
                ],
            },
        },
    },
    i: {
        title: "Interoperable",
        description: "The data should be able to be integrated with other data.",
        scores: {
            i1: {
                title: "I1",
                description: "(Meta)data use a formal, accessible, shared, and broadly applicable language for knowledge representation.",
                requirements: [
                    {
                        value: 1,
                        description: "Metadata is structured using an open standard",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                    {
                        value: 2,
                        description: "Metadata is machine readable",
                        query: `ASK { #iri# ?p ?o }`,
                    },
                ],
            },
            i2: {
                title: "I2",
                description: "(Meta)data use vocabularies that follow FAIR principles",
                requirements: [
                    {
                        value: 4,
                        description: "F1 & F2 are scored fully",
                        conditions: [
                            {
                                title: "F1 has scored fully",
                                key: "f1",
                                value: "max",
                            },
                            {
                                title: "F2 has scored fully",
                                key: "f2",
                                value: "max",
                            },
                        ],
                    },
                    {
                        value: 4,
                        description: "Reference vocabularies have been used to describe the data",
                        query: `ASK {
                                    #iri# dcterms:type ?indigeneity ;
                                        dcat:theme ?theme ;
                                        dcterms:license ?license ;
                                        dcterms:accessRights ?accessRights .
                                }`,
                    },
                    {
                        value: 1,
                        description: "Vocabulary references use global identifiers",
                        query: `ASK {
                                    #iri# dcterms:type|dcat:theme|dcterms:license|dcterms:accessRights ?vocab .
                                    FILTER isIRI(?vocab)
                                }`,
                    },
                ],
            },
            i3: {
                title: "I3",
                description: "(Meta)data include qualified references to other (meta)data",
                requirements: [
                    {
                        value: 4,
                        description: "Metadata includes links to other metadata",
                        query: `ASK {
                                    {
                                        #iri# dcterms:license ?license .
                                        FILTER isIRI(?license)
                                    }
                                    UNION {
                                        #iri# dcterms:spatial ?spatial .
                                        FILTER isIRI(?spatial)
                                    }
                                    UNION {
                                        #iri# dcat:distribution ?distribution .
                                        ?distribution dcat:accessURL ?accessURL .
                                    }
                                    UNION {
                                        #iri# prov:wasInfluencedBy ?idgf .
                                        ?idgf sdo:additionalType <https://data.idnau.org/pid/vocab/policy-types/indigenous-data-governance> ;
                                            sdo:url ?idgfUrl .
                                    }
                                }`,
                    },
                    {
                        value: 1,
                        description: "Metadata is machine readable",
                        conditions: [
                            {
                                title: "F1 > 1",
                                key: "f1",
                                value: 2,
                            },
                        ],
                    },
                ],
            },
        },
    },
    r: {
        title: "Reusable",
        description: "Metadata and data should be well-described so that they can be replicated and/or combined in different settings.",
        scores: {
            r1: {
                title: "R1",
                description: "(Meta)data are richly described with a plurality of accurate and relevant attributes",
                scores: {
                    "r1.1": {
                        title: "R1.1",
                        description: "(Meta)data are released with a clear and accessible data usage license",
                        requirements: [
                            {
                                value: 1,
                                description: "Metadata includes license",
                                query: `ASK { #iri# dcterms:license ?license }`,
                            },
                            {
                                value: 1,
                                description: "Metadata includes rights statement",
                                query: `ASK { #iri# dcterms:rights ?rights }`,
                            },
                            {
                                value: 1,
                                description: "Access rights exist",
                                query: `ASK { #iri# dcterms:accessRights ?accessRights }`,
                            },
                        ],
                    },
                    "r1.2": {
                        title: "R1.2",
                        description: "(Meta)data are associated with detailed provenance",
                        requirements: [
                            {
                                value: 1,
                                description: "Includes role custodian/author/creator",
                                query: `ASK {
                                            VALUES ?role {
                                                <https://linked.data.gov.au/def/data-roles/author>
                                                <https://linked.data.gov.au/def/data-roles/creator>
                                                <https://linked.data.gov.au/def/data-roles/custodian>
                                            }
                                            #iri# prov:qualifiedAttribution ?agentRole .
                                            ?agentRole dcat:hadRole ?role .
                                        }`,
                            },
                            {
                                value: 1,
                                description: "Created date included",
                                query: `ASK { #iri# dcterms:created ?created }`,
                            },
                            {
                                value: 1,
                                description: "License exists",
                                query: `ASK { #iri# dcterms:license ?license }`,
                            },
                            {
                                value: 2,
                                description: "Spatial exists",
                                query: `ASK { #iri# dcterms:spatial ?spatial }`,
                            },
                            {
                                value: 1,
                                description: "Contact details exist",
                                query: `ASK {
                                            #iri# prov:qualifiedAttribution ?agentRole .
                                            ?agentRole dcat:hadRole <https://linked.data.gov.au/def/data-roles/pointOfContact> .
                                        }`,
                            },
                        ],
                    },
                    "r1.3": {
                        title: "R1.3",
                        description: "(Meta)data meet domain-relevant community standards",
                        requirements: [
                            {
                                value: 2,
                                description: "Metadata includes a link to the data source",
                                conditions: [
                                    {
                                        title: "F3 = 2",
                                        key: "f3",
                                        value: 2,
                                    },
                                ],
                            },
                            {
                                value: 1,
                                description: "The data source has provenance",
                                query: `ASK { #iri# ?p ?o }`,
                            },
                        ],
                    },
                },
            },
        },
    },
};

export default fairRules;