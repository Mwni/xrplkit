import { extractExchanges } from '@xrplworks/tx'


let tx = JSON.parse(`{
    "Account": "rE9Ef6Ldf3TrhtFHwsDrbNB2dzfwoCyMGY",
    "Fee": "10",
    "Flags": 2148139008,
    "LastLedgerSequence": 69183113,
    "Sequence": 60852412,
    "SigningPubKey": "02273713CEAC552CD26CE40BCC2DAF411E7692C9A3452397CCE6C69085590A2A24",
    "TakerGets": {
        "currency": "USD",
        "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
        "value": "500"
    },
    "TakerPays": "797315324",
    "TransactionType": "OfferCreate",
    "TxnSignature": "3045022100C6016558F587ECA7D81C5129C70A24A05B93B31607477F59962FBBA36FBF11B7022078D0607118E2CA03113E82D71B57F9F9090A64AC72756A516E5026A756C746F7",
    "date": 696172460,
    "hash": "D6FD51ED7BEF68A463D904F09D3E1A982401D66887E372A0171907947B844DFB",
    "inLedger": 69183106,
    "ledger_index": 69183106,
    "meta": {
        "AffectedNodes": [
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Balance": {
                            "currency": "USD",
                            "issuer": "rrrrrrrrrrrrrrrrrrrrBZbvji",
                            "value": "-217.137742504858"
                        },
                        "Flags": 2228224,
                        "HighLimit": {
                            "currency": "USD",
                            "issuer": "rhS2H7ETM3wBkFETvYycoUm9FEDYi44Pg4",
                            "value": "1000000000"
                        },
                        "HighNode": "20",
                        "LowLimit": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "0"
                        },
                        "LowNode": "4d3"
                    },
                    "LedgerEntryType": "RippleState",
                    "LedgerIndex": "0225F9FB255748DA08738AF78EEFBD0EC8B036C8EE4F3DE7DBA5D9BA90E8D507",
                    "PreviousFields": {
                        "Balance": {
                            "currency": "USD",
                            "issuer": "rrrrrrrrrrrrrrrrrrrrBZbvji",
                            "value": "0"
                        }
                    },
                    "PreviousTxnID": "99B597322E26CA5514C73BCE8C186FE868AF1112FE9DDBBC4EA5F2F784E03237",
                    "PreviousTxnLgrSeq": 69183024
                }
            },
            {
                "DeletedNode": {
                    "FinalFields": {
                        "Account": "rhS2H7ETM3wBkFETvYycoUm9FEDYi44Pg4",
                        "BookDirectory": "DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4E15807C9C5D36B6",
                        "BookNode": "0",
                        "Flags": 0,
                        "OwnerNode": "20",
                        "PreviousTxnID": "10C8980BFDC3E8E77DA392A053688EDB4A0CC00D9CF3EEBD51C896AA9D0C4C96",
                        "PreviousTxnLgrSeq": 69183092,
                        "Sequence": 35567042,
                        "TakerGets": "0",
                        "TakerPays": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "0"
                        }
                    },
                    "LedgerEntryType": "Offer",
                    "LedgerIndex": "128A648481D420455B747F2BBAA07F1C1D729C92AF7D7954C67BE08DCFCC1176",
                    "PreviousFields": {
                        "TakerGets": "358772098",
                        "TakerPays": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "217.137742504858"
                        }
                    }
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Flags": 0,
                        "IndexNext": "c52d",
                        "IndexPrevious": "c52b",
                        "Owner": "r39rBggWHTUN95x31mAdxPCC7XnhuHRHor",
                        "RootIndex": "1C2C02B3CF15DD8E5B1260F313162DF61528B1D3B9407B0785DB978940C048B6"
                    },
                    "LedgerEntryType": "DirectoryNode",
                    "LedgerIndex": "1ABB4698CD8209CB2FF2985032955137DF1814D0C98771710691A1F83EF84FAA"
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Account": "rs9tBKt96q9gwrePKPqimUuF7vErgMaker",
                        "BookDirectory": "DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4E15B388A0FCB215",
                        "BookNode": "0",
                        "Expiration": 702172451,
                        "Flags": 0,
                        "OwnerNode": "0",
                        "Sequence": 31478449,
                        "TakerGets": "2006726547",
                        "TakerPays": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "1225.783608350123"
                        }
                    },
                    "LedgerEntryType": "Offer",
                    "LedgerIndex": "61FFD6039E11777D547EA4CFC24CF1651126E0ABA308538D932F262A8E434422",
                    "PreviousFields": {
                        "TakerGets": "2314131961",
                        "TakerPays": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "1413.558329200732"
                        }
                    },
                    "PreviousTxnID": "AAA6DFEC1786E17E1D2152E7D5ECD6F15000DD098B0EB49B1D29FFE8F51D5F3D",
                    "PreviousTxnLgrSeq": 69183105
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Account": "rhS2H7ETM3wBkFETvYycoUm9FEDYi44Pg4",
                        "Balance": "1304734585",
                        "Flags": 0,
                        "OwnerCount": 16,
                        "Sequence": 35567046
                    },
                    "LedgerEntryType": "AccountRoot",
                    "LedgerIndex": "6B555B9A14F4E40BB83EF68DE332ECCCC84D310AFFABBAA3606F7969C688EC21",
                    "PreviousFields": {
                        "Balance": "1663506683",
                        "OwnerCount": 17
                    },
                    "PreviousTxnID": "676140C11FD03ACF488C1580AC8EA29DD39FEB04C51A0A63D3B14FFDE7B27276",
                    "PreviousTxnLgrSeq": 69183105
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Account": "rs9tBKt96q9gwrePKPqimUuF7vErgMaker",
                        "Balance": "39843610367",
                        "Flags": 0,
                        "OwnerCount": 13,
                        "Sequence": 31478450
                    },
                    "LedgerEntryType": "AccountRoot",
                    "LedgerIndex": "7B27505E5F915E531ED38221CCD639DD939AE29CDAC5C58436B4030D1D66D5DD",
                    "PreviousFields": {
                        "Balance": "40151015781",
                        "OwnerCount": 12
                    },
                    "PreviousTxnID": "AAA6DFEC1786E17E1D2152E7D5ECD6F15000DD098B0EB49B1D29FFE8F51D5F3D",
                    "PreviousTxnLgrSeq": 69183105
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Flags": 0,
                        "IndexPrevious": "9c3",
                        "Owner": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                        "RootIndex": "7E1247F78EFC74FA9C0AE39F37AF433966615EB9B757D8397C068C2849A8F4A5"
                    },
                    "LedgerEntryType": "DirectoryNode",
                    "LedgerIndex": "8BF4B4A658A08B0645231955C0657BCA385E65635B08291ACE04C0C458B3EC47"
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Account": "r39rBggWHTUN95x31mAdxPCC7XnhuHRHor",
                        "Balance": "6629451713",
                        "Flags": 0,
                        "MessageKey": "02000000000000000000000000CC68FD0E56410D776B0A579873E8A4E87D2821C9",
                        "OwnerCount": 139,
                        "Sequence": 2727759
                    },
                    "LedgerEntryType": "AccountRoot",
                    "LedgerIndex": "A5DE3E755190FEBE0EFAC30024CB563D21856C666B57C3B59A8F14A938FA2F70",
                    "PreviousFields": {
                        "Balance": "6785408556",
                        "OwnerCount": 140
                    },
                    "PreviousTxnID": "6BBE4C23F3B8F3450A6E86C3C9B56EFBFF4777BAF687FFE24AF1B0D658ED2FD2",
                    "PreviousTxnLgrSeq": 69183063
                }
            },
            {
                "DeletedNode": {
                    "FinalFields": {
                        "Account": "r39rBggWHTUN95x31mAdxPCC7XnhuHRHor",
                        "BookDirectory": "DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4E15A93A215FD035",
                        "BookNode": "0",
                        "Flags": 131072,
                        "OwnerNode": "c52c",
                        "PreviousTxnID": "619E3617E1BBDDB3475C34CAF1F22BFAAA8CC80ADD275C25A98CB0099AFF9B68",
                        "PreviousTxnLgrSeq": 69182668,
                        "Sequence": 2727734,
                        "TakerGets": "0",
                        "TakerPays": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "0"
                        }
                    },
                    "LedgerEntryType": "Offer",
                    "LedgerIndex": "B7BC87917EE61D19771071017F1AD38103308768C17064B9AE9A55D5F610D6D8",
                    "PreviousFields": {
                        "TakerGets": "155956843",
                        "TakerPays": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "95.0875366445324"
                        }
                    }
                }
            },
            {
                "ModifiedNode": {
                    "LedgerEntryType": "AccountRoot",
                    "LedgerIndex": "B7D526FDDF9E3B3F95C3DC97C353065B0482302500BBB8051A5C090B596C6133",
                    "PreviousTxnID": "18ACD11A0D2A77C90D479FAF022366B34B1CBE05E018C53F48439B1B6EB7B97E",
                    "PreviousTxnLgrSeq": 69183071
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Balance": {
                            "currency": "USD",
                            "issuer": "rrrrrrrrrrrrrrrrrrrrBZbvji",
                            "value": "-1589.973728665647"
                        },
                        "Flags": 2228224,
                        "HighLimit": {
                            "currency": "USD",
                            "issuer": "rE9Ef6Ldf3TrhtFHwsDrbNB2dzfwoCyMGY",
                            "value": "999999999"
                        },
                        "HighNode": "0",
                        "LowLimit": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "0"
                        },
                        "LowNode": "62b"
                    },
                    "LedgerEntryType": "RippleState",
                    "LedgerIndex": "D3068FC3E69481D48D0F87FC4FC825D294BD47A7FCB230D968CCFF254ECBF137",
                    "PreviousFields": {
                        "Balance": {
                            "currency": "USD",
                            "issuer": "rrrrrrrrrrrrrrrrrrrrBZbvji",
                            "value": "-2090.973728665645"
                        }
                    },
                    "PreviousTxnID": "16707F3A7E51FFB7E07BE88709C5EAEDE585D55F02B1BFF355AB1C4B2F8C856D",
                    "PreviousTxnLgrSeq": 69152125
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Account": "rE9Ef6Ldf3TrhtFHwsDrbNB2dzfwoCyMGY",
                        "Balance": "41718531254",
                        "Flags": 0,
                        "OwnerCount": 50,
                        "Sequence": 60852413
                    },
                    "LedgerEntryType": "AccountRoot",
                    "LedgerIndex": "D762B5BB653CCFCCF592FCA049B2046E4E56A5939AA774EB52ED008ACDCFD0C8",
                    "PreviousFields": {
                        "Balance": "40896396909",
                        "Sequence": 60852412
                    },
                    "PreviousTxnID": "3C80F2F769585EAF5EA6190117DEC354C6977E375287E301D9FC84121F7A0ED3",
                    "PreviousTxnLgrSeq": 69171502
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Flags": 0,
                        "Owner": "rs9tBKt96q9gwrePKPqimUuF7vErgMaker",
                        "RootIndex": "D9AC75B265FBABD909B43FD8B254796F805585FD587C9112E301A5E582FA87A7"
                    },
                    "LedgerEntryType": "DirectoryNode",
                    "LedgerIndex": "D9AC75B265FBABD909B43FD8B254796F805585FD587C9112E301A5E582FA87A7"
                }
            },
            {
                "DeletedNode": {
                    "FinalFields": {
                        "ExchangeRate": "4e15807c9c5d36b6",
                        "Flags": 0,
                        "RootIndex": "DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4E15807C9C5D36B6",
                        "TakerGetsCurrency": "0000000000000000000000000000000000000000",
                        "TakerGetsIssuer": "0000000000000000000000000000000000000000",
                        "TakerPaysCurrency": "0000000000000000000000005553440000000000",
                        "TakerPaysIssuer": "0A20B3C85F482532A9578DBB3950B85CA06594D1"
                    },
                    "LedgerEntryType": "DirectoryNode",
                    "LedgerIndex": "DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4E15807C9C5D36B6"
                }
            },
            {
                "DeletedNode": {
                    "FinalFields": {
                        "ExchangeRate": "4e15a93a215fd035",
                        "Flags": 0,
                        "RootIndex": "DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4E15A93A215FD035",
                        "TakerGetsCurrency": "0000000000000000000000000000000000000000",
                        "TakerGetsIssuer": "0000000000000000000000000000000000000000",
                        "TakerPaysCurrency": "0000000000000000000000005553440000000000",
                        "TakerPaysIssuer": "0A20B3C85F482532A9578DBB3950B85CA06594D1"
                    },
                    "LedgerEntryType": "DirectoryNode",
                    "LedgerIndex": "DFA3B6DDAB58C7E8E5D944E736DA4B7046C30E4F460FD9DE4E15A93A215FD035"
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Flags": 0,
                        "IndexNext": "0",
                        "IndexPrevious": "8",
                        "Owner": "rhS2H7ETM3wBkFETvYycoUm9FEDYi44Pg4",
                        "RootIndex": "A86F1886910A8B86BB0221982AA3E26C015FD3455EFCDABA35FE905AA772749C"
                    },
                    "LedgerEntryType": "DirectoryNode",
                    "LedgerIndex": "EC2BF834D9ED3BF08521A8114683C12C3F767D75FCE01A32B7DAB000C979247C"
                }
            },
            {
                "ModifiedNode": {
                    "FinalFields": {
                        "Balance": {
                            "currency": "USD",
                            "issuer": "rrrrrrrrrrrrrrrrrrrrBZbvji",
                            "value": "-398.2716480461722"
                        },
                        "Flags": 2228224,
                        "HighLimit": {
                            "currency": "USD",
                            "issuer": "r39rBggWHTUN95x31mAdxPCC7XnhuHRHor",
                            "value": "1000000000"
                        },
                        "HighNode": "bc88",
                        "LowLimit": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "0"
                        },
                        "LowNode": "88c"
                    },
                    "LedgerEntryType": "RippleState",
                    "LedgerIndex": "F39B0D2EB3C429C39DDD7F896A0B9FC4295D7E4772DBBC14D33C5E80240542AC",
                    "PreviousFields": {
                        "Balance": {
                            "currency": "USD",
                            "issuer": "rrrrrrrrrrrrrrrrrrrrBZbvji",
                            "value": "-303.1841114016398"
                        }
                    },
                    "PreviousTxnID": "45596093185E14415B49341C642DF750952B15502C94EA1F1511D4FCD39F4A83",
                    "PreviousTxnLgrSeq": 69183024
                }
            },
            {
                "CreatedNode": {
                    "LedgerEntryType": "RippleState",
                    "LedgerIndex": "FF9E43FA751AC8E4E24D3CCF84ED7C41207E335F0C53BA2CFF852A238ED545EC",
                    "NewFields": {
                        "Balance": {
                            "currency": "USD",
                            "issuer": "rrrrrrrrrrrrrrrrrrrrBZbvji",
                            "value": "-187.7747208506096"
                        },
                        "Flags": 2228224,
                        "HighLimit": {
                            "currency": "USD",
                            "issuer": "rs9tBKt96q9gwrePKPqimUuF7vErgMaker",
                            "value": "0"
                        },
                        "LowLimit": {
                            "currency": "USD",
                            "issuer": "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B",
                            "value": "0"
                        },
                        "LowNode": "9c4"
                    }
                }
            }
        ],
        "TransactionIndex": 30,
        "TransactionResult": "tesSUCCESS"
    },
    "validated": true
}`)

let exchanges = extractExchanges(tx, {collapse: true})

console.log(exchanges)