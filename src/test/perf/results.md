# Performance Results

The following table lists the different EC2 instances tested. The `r5n.large`
instance is the main instance used for most of the `dap_db_backends` backend
tasks up until now, and was chosen to emulate the same environment of a
`neptune` instance when testing different graph databases. As a result, these
EC2 instance types (`r5n.xxxx`) are **memory** optimised. In could be (and most
likely is the case) that computation optimised instances are in fact a better
choice for running a dedicated spotlight tool REST endpoint. However, for the
purposes of a simple experiment on the effects of vertical scaling on spotlight
annotation performance, the fairest way to compare all three different machines
was to use the same EC2 instance type and simply scale up one level of cost, as
show in the table below:

| Instance    | vCPUs | RAM | On Demand Hourly Rate |
| ----------- | ----- | --- | --------------------- |
| r5n.large   | 2     | 16  | $0.148                |
| r5n.xlarge  | 4     | 32  | $0.296                |
| r5n.2xlarge | 8     | 64  | $0.592                |

The following table shows the results of the different instance's performance,
when tasked with annotating 100K documents using a page size of 1K (i.e. 100
network requests where made to the ElasticSearch endpoint for each test). The
estimated time column simply multiplies the time taken column by 18 to give a
rough estimate of how long it would take to annotated all 1.8M documents
currently on the `arxiv_v6` index. Also of note, the smallest instance
`r5n.large` would fail when given a batch size of 100, and so was not tested
using this size.

| Instance    | Batch Size | Time taken in Seconds | Time in Human Readable Format | Estimated time  |
| ----------- | ---------- | --------------------- | ----------------------------- | --------------- |
| r5n.large   | 10         | 14281                 | 03:58:01                      | 2 days 23:24:18 |
| r5n.xlarge  | 10         | 7243                  | 02:00:43                      | 1 day 12:12:54  |
| r5n.xlarge  | 100        | 7198                  | 01:59:58                      | 1 day 11:59:24  |
| r5n.2xlarge | 10         | 4589                  | 01:16:29                      | 22:56:42        |
| r5n.2xlarge | 100        | 4596                  | 01:16:36                      | 22:58:48        |

## Conclusions

Vertically scaling definitely improves performance, with a reduction in
computation time of ~32% when using a `r5n.2xlarge` instance over the original
instance used. This improvement would likely increase if more suitable EC2
instances were used (ones that focus on computational performance rather than
memory). There is no significant change in performance when using a larger batch
size. This would seem to suggest that parallelization of annotations using
async/await does not affect performance, and so the bottleneck appears to be
located on the computational level, and not the I/O level. As a result,
horizontal scaling would have to be performed to improve this bottleneck.
Horizontal scaling is another elegant solution to improving performance. One
solution might be: for N documents in an index, create a cluster with k
instances. Each instance then needs to perform k/N annotations. We allow the
ElasticSearch machine to deal with queuing updates, and each document's
annotation can be performed in isolation, i.e. there is a complete separation of
concerns and memory.
