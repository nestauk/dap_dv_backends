## Flattened `confidence` Histogram

Aggregates all `confidence` values into a histogram, each bucket indicating one of
the 10 possible `confidence` levels annotated. Flattened here denotes the fact
that all annotated entities are treated as a flat list - no per document
analysis is performed.

Endpoint: `POST arxiv_v6/_search`

See:

- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/search-aggregations-bucket-terms-aggregation.html
- https://www.elastic.co/guide/en/elasticsearch/reference/7.4/nested.html

## Notes

We have decided not to use the `histogram` API here due to errors produced by
rounding of floating precision point values. When using a histogram with
interval 0.1, the values for the buckets turn out to be incorrect. In
particular, there are no entities found with `confidence `0.7, which is obviously
wrong. Instead, it seems like all entities tagged at `confidence` 0.7 are
erroneously counted in the 0.6 bucket, meaning that bucket contains all entities
for `confidence` 0.6 and 0.7:

Request:
```json
{
	"size": 0,
	"aggs": {
		"dbpedia": {
			"nested": {
				"path": "dbpedia_entities"
			},
			"aggs": {
				"confidence": {
					"histogram": {
						"field": "dbpedia_entities.confidence",
            "interval": 0.1
					}
				}
			}
		}
	}
}
```
Truncated response:
```json
...
"aggregations": {
  "dbpedia": {
    "doc_count": 75296846,
    "confidence": {
      "buckets": [
        {
          "key": 0.1,
          "doc_count": 411055
        },
        {
          "key": 0.2,
          "doc_count": 652848
        },
        {
          "key": 0.30000000000000004,
          "doc_count": 53424468
        },
        {
          "key": 0.4,
          "doc_count": 6007261
        },
        {
          "key": 0.5,
          "doc_count": 3751608
        },
        {
          "key": 0.6000000000000001,
          "doc_count": 3500601
        },
        {
          "key": 0.7000000000000001,
          "doc_count": 0
        },
        {
          "key": 0.8,
          "doc_count": 7549005
        }
      ]
    }
  }
}
```
The `terms` aggregation has difficulty creating buckets whose keys are of type
float or double, due to floating point precision errors. As a result, the keys
found in the `response.json` can look bizarre. In actual fact, the keys are
indistinguishable (in the Java Runtime) due to the rounding errors. Example
(using key for `confidence` bucket 0.4):

```java
class Main {  
  public static void main(String args[]) { 
    float example = 0.4000000059604645f;
    System.out.println(example); // 0.4
  } 
}
```

You can find a replit for the example
[here]([https://replit.com/@doogyb/Floating-Point-Precision-Errors#Main.java).

We've decided to document this behavior for now and move on. However, there
exists two possible solutions to the problem. The first involves changing the
schema so that `confidence` values are encoded as integers. The current values
would be mapped using a factor of 10, so that entities tagged at confidence
level 0.3 would have an integer `confidence` value of 3, those tagged at 0.7 an
integer value of 7, and so on. The advantage of this approach is that we
guarantee the correct term bucket keys due to no risk of floating point
precision errors. However, we deviate from the accepted inputs of the Spotlight
API, which only accepts values for `confidence` within the range 0 and 1.

The second solution is to use the `histogram` API, with interval set to 0.1 and
an offset set to a value very slightly below zero. The following request is
included for reference:

```json
{
	"size": 0,
	"aggs": {
		"dbpedia": {
			"nested": {
				"path": "dbpedia_entities"
			},
			"aggs": {
				"confidence": {
					"histogram": {
						"field": "dbpedia_entities.confidence",
            "interval": 0.1,
            "offset": -0.0000001
					}
				}
			}
		}
	}
}
```

Truncated response:
```json
...
"aggregations": {
  "dbpedia": {
    "doc_count": 75296846,
    "confidence": {
      "buckets": [
        {
          "key": 0.0999999,
          "doc_count": 411055
        },
        {
          "key": 0.1999999,
          "doc_count": 652848
        },
        {
          "key": 0.29999990000000004,
          "doc_count": 53424468
        },
        {
          "key": 0.3999999,
          "doc_count": 6007261
        },
        {
          "key": 0.4999999,
          "doc_count": 3751608
        },
        {
          "key": 0.5999999000000001,
          "doc_count": 1970197
        },
        {
          "key": 0.6999999000000001,
          "doc_count": 1530404
        },
        {
          "key": 0.7999999000000001,
          "doc_count": 1346700
        },
        {
          "key": 0.8999999000000001,
          "doc_count": 6202305
        }
      ]
    }
  }
}
```

However the values still do not strictly match up with the encoded confidence
levels. This approach is however more in line with what is suggested according
to this Github [issue](https://github.com/elastic/elasticsearch/issues/30529)
for Elastic Search, due to the issue surrounding encoding floating point values
accurately when using a base 2 system vs base 10 system.