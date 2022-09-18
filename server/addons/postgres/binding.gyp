{
    "targets": [
        {
            "target_name": "addon",
            "dependencies": [
            ],
            "defines": [
            ],
            "include_dirs": [
                "./",
                "../apiV1",
            ],
            "sources": [
                "../apiV1/kode.cc",
                "../apiV1/system.cc",
                "pgData.cc",
                "pg.cc",
            ],
            "conditions": [
                [
                    'OS=="linux"', {
                        "defines": [
                            "PLATFORM_LINUX",
                        ],
                        "sources": [
                        ],
                    }
                ],
                [
                    'OS=="mac"', {
                        "defines": [
                            "PLATFORM_MAC",
                        ],
                        "include_dirs": [
                            "/Library/PostgreSQL/12/include"
                        ],
                        "sources": [
                        ],
                    }
                ],
                [
                    'OS=="win"', {
                        "defines": [
                            "PLATFORM_WIN",
                        ],
                        "sources": [
                        ],
                    }
                ],
            ]
        }
    ]
}
