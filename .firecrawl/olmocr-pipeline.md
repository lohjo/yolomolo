[Skip to content](https://github.com/allenai/olmocr/blob/main/olmocr/pipeline.py#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/allenai/olmocr/blob/main/olmocr/pipeline.py) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/allenai/olmocr/blob/main/olmocr/pipeline.py) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/allenai/olmocr/blob/main/olmocr/pipeline.py) to refresh your session.Dismiss alert

{{ message }}

[allenai](https://github.com/allenai)/ **[olmocr](https://github.com/allenai/olmocr)** Public

- [Notifications](https://github.com/login?return_to=%2Fallenai%2Folmocr) You must be signed in to change notification settings
- [Fork\\
1.4k](https://github.com/login?return_to=%2Fallenai%2Folmocr)
- [Star\\
17.3k](https://github.com/login?return_to=%2Fallenai%2Folmocr)


## Collapse file tree

## Files

main

Search this repository(forward slash)` forward slash/`

/

# pipeline.py

Copy path

Blame

More file actions

Blame

More file actions

## Latest commit

[![jakep-allenai](https://avatars.githubusercontent.com/u/178819005?v=4&size=40)](https://github.com/jakep-allenai)[jakep-allenai](https://github.com/allenai/olmocr/commits?author=jakep-allenai)

[Refactor dataloader and FrontMatter parser which is used elsewhere in…](https://github.com/allenai/olmocr/commit/8854eda39eea58eab2724e84ad3cd0994f3b31cf)

Open commit detailsfailure

2 months agoMar 9, 2026

[8854eda](https://github.com/allenai/olmocr/commit/8854eda39eea58eab2724e84ad3cd0994f3b31cf) · 2 months agoMar 9, 2026

## History

[History](https://github.com/allenai/olmocr/commits/main/olmocr/pipeline.py)

Open commit details

[View commit history for this file.](https://github.com/allenai/olmocr/commits/main/olmocr/pipeline.py) History

1532 lines (1274 loc) · 64.9 KB

/

# pipeline.py

Top

## File metadata and controls

- Code

- Blame


1532 lines (1274 loc) · 64.9 KB

[Raw](https://github.com/allenai/olmocr/raw/refs/heads/main/olmocr/pipeline.py)

Copy raw file

Download raw file

Open symbols panel

Edit and raw actions

1

2

3

4

5

6

7

8

9

10

11

12

13

14

15

16

17

18

19

20

21

22

23

24

25

26

27

28

29

30

31

32

33

34

35

36

37

38

39

40

41

42

43

44

45

46

47

48

49

50

51

52

53

54

55

56

57

58

59

60

61

62

63

64

65

66

67

68

69

70

71

72

73

74

75

76

77

78

79

80

81

82

83

84

85

86

87

88

89

90

91

92

93

94

95

96

97

98

99

100

101

102

103

104

105

106

107

108

109

110

111

112

113

114

115

116

117

118

119

120

121

122

123

124

125

126

127

128

129

130

131

132

133

134

135

136

137

138

139

140

141

142

143

144

145

146

147

148

149

150

151

152

153

154

155

156

157

158

159

160

161

162

163

164

165

166

167

168

169

170

171

172

173

174

175

176

177

178

179

180

181

182

183

184

185

186

187

188

189

190

191

192

193

194

195

196

197

198

199

200

201

202

203

204

205

206

207

208

209

210

211

212

213

214

215

216

217

218

219

220

221

222

223

224

225

226

227

228

229

230

231

232

233

234

235

236

237

238

239

240

241

242

243

244

245

246

247

248

249

250

251

252

253

254

255

256

257

258

259

260

261

262

263

264

265

266

267

268

269

270

271

272

273

274

275

276

277

278

279

280

281

282

283

284

285

286

287

288

289

290

291

292

293

294

295

296

297

298

299

300

301

302

303

304

305

306

307

308

309

310

311

312

313

314

315

316

317

318

319

320

321

322

323

324

325

326

327

328

329

330

331

332

333

334

335

336

337

338

339

340

341

342

343

344

345

346

347

348

349

350

351

352

353

354

355

356

357

358

359

360

361

362

363

364

365

366

367

368

369

370

371

372

373

374

375

376

377

378

379

380

381

382

383

384

385

386

387

388

389

390

391

392

393

394

395

396

397

398

399

400

401

402

403

404

405

406

407

408

409

410

411

412

413

414

415

416

417

418

419

420

421

422

423

424

425

426

427

428

429

430

431

432

433

434

435

436

437

438

439

440

441

442

443

444

445

446

447

448

449

450

451

452

453

454

455

456

457

458

459

460

461

462

463

464

465

466

467

468

469

470

471

472

473

474

475

476

477

478

479

480

481

482

483

484

485

486

487

488

489

490

491

492

493

494

495

496

497

498

499

500

501

502

503

504

505

506

507

508

509

510

511

512

513

514

515

516

517

518

519

520

521

522

523

524

525

526

527

528

529

530

531

532

533

534

535

536

537

538

539

540

541

542

543

544

545

546

547

548

549

550

551

552

553

554

555

556

557

558

559

560

561

562

563

564

565

566

567

568

569

570

571

572

573

574

575

576

577

578

579

580

581

582

583

584

585

586

587

588

589

590

591

592

593

594

595

596

597

598

599

600

601

602

603

604

605

606

607

608

609

610

611

612

613

614

615

616

617

618

619

620

621

622

623

624

625

626

627

628

629

630

631

632

633

634

635

636

637

638

639

640

641

642

643

644

645

646

647

648

649

650

651

652

653

654

655

656

657

658

659

660

661

662

663

664

665

666

667

668

669

670

671

672

673

674

675

676

677

678

679

680

681

682

683

684

685

686

687

688

689

690

691

692

693

694

695

696

697

698

699

700

701

702

703

704

705

706

707

708

709

710

711

712

713

714

715

716

717

718

719

720

721

722

723

724

725

726

727

728

729

730

731

732

733

734

735

736

737

738

739

740

741

742

743

744

745

746

747

748

749

750

751

752

753

754

755

756

757

758

759

760

761

762

763

764

765

766

767

768

769

770

771

772

773

774

775

776

777

778

779

780

781

782

783

784

785

786

787

788

789

790

791

792

793

794

795

796

797

798

799

800

801

802

803

804

805

806

807

808

809

810

811

812

813

814

815

816

817

818

819

820

821

822

823

824

825

826

827

828

829

830

831

832

833

834

835

836

837

838

839

840

841

842

843

844

845

846

847

848

849

850

851

852

853

854

855

856

857

858

859

860

861

862

863

864

865

866

867

868

869

870

871

872

873

874

875

876

877

878

879

880

881

882

883

884

885

886

887

888

889

890

891

892

893

894

895

896

897

898

899

900

901

902

903

904

905

906

907

908

909

910

911

912

913

914

915

916

917

918

919

920

921

922

923

924

925

926

927

928

929

930

931

932

933

934

935

936

937

938

939

940

941

942

943

944

945

946

947

948

949

950

951

952

953

954

955

956

957

958

959

960

961

962

963

964

965

966

967

968

969

970

971

972

973

974

975

976

977

978

979

980

981

982

983

984

985

986

987

988

989

990

991

992

993

994

995

996

997

998

999

1000

1001

1002

1003

1004

1005

1006

1007

1008

1009

1010

1011

1012

1013

1014

1015

1016

1017

1018

1019

1020

1021

1022

1023

1024

1025

1026

1027

1028

1029

1030

1031

1032

1033

1034

1035

1036

1037

1038

1039

1040

1041

1042

1043

1044

1045

1046

1047

1048

1049

1050

1051

1052

1053

1054

1055

1056

1057

1058

1059

1060

1061

1062

1063

1064

1065

1066

1067

1068

1069

1070

1071

1072

1073

1074

1075

1076

1077

1078

1079

1080

1081

1082

1083

1084

1085

1086

1087

1088

1089

1090

1091

1092

1093

1094

1095

1096

1097

1098

1099

1100

1101

1102

1103

1104

1105

1106

1107

1108

1109

1110

1111

1112

1113

1114

1115

1116

1117

1118

1119

1120

1121

1122

1123

1124

1125

1126

1127

1128

1129

1130

1131

1132

1133

1134

1135

1136

1137

1138

1139

1140

1141

1142

1143

1144

1145

1146

1147

1148

1149

1150

1151

1152

1153

1154

1155

1156

1157

1158

1159

1160

1161

1162

1163

1164

1165

1166

1167

1168

1169

1170

1171

1172

1173

1174

1175

1176

1177

1178

1179

1180

1181

1182

1183

1184

1185

1186

1187

1188

1189

1190

1191

1192

1193

1194

1195

1196

1197

1198

1199

1200

1201

1202

1203

1204

1205

1206

1207

1208

1209

1210

1211

1212

1213

1214

1215

1216

1217

1218

1219

1220

1221

1222

1223

1224

1225

1226

1227

1228

1229

1230

1231

1232

1233

1234

1235

1236

1237

1238

1239

1240

1241

1242

1243

1244

1245

1246

1247

1248

1249

1250

1251

1252

1253

1254

1255

1256

1257

1258

1259

1260

1261

1262

1263

1264

1265

1266

1267

1268

1269

1270

1271

1272

1273

1274

1275

1276

1277

1278

1279

1280

1281

1282

1283

1284

1285

1286

1287

1288

1289

1290

1291

1292

1293

1294

1295

1296

1297

1298

1299

1300

1301

1302

1303

1304

1305

1306

1307

1308

1309

1310

1311

1312

1313

1314

1315

1316

1317

1318

1319

1320

1321

1322

1323

1324

1325

1326

1327

1328

1329

1330

1331

1332

1333

1334

1335

1336

1337

1338

1339

1340

1341

1342

1343

1344

1345

1346

1347

1348

1349

1350

1351

1352

1353

1354

1355

1356

1357

1358

1359

1360

1361

1362

1363

1364

1365

1366

1367

1368

1369

1370

1371

1372

1373

1374

1375

1376

1377

1378

1379

1380

1381

1382

1383

1384

1385

1386

1387

1388

1389

1390

1391

1392

1393

1394

1395

1396

1397

1398

1399

1400

1401

1402

1403

1404

1405

1406

1407

1408

1409

1410

1411

1412

1413

1414

1415

1416

1417

1418

1419

1420

1421

1422

1423

1424

1425

1426

1427

1428

1429

1430

1431

1432

1433

1434

1435

1436

1437

1438

1439

1440

1441

1442

1443

1444

1445

1446

1447

1448

1449

1450

1451

1452

1453

1454

1455

1456

1457

1458

1459

1460

1461

1462

1463

1464

1465

1466

1467

1468

1469

1470

1471

1472

1473

1474

1475

1476

1477

1478

1479

1480

1481

1482

1483

1484

1485

1486

1487

1488

1489

1490

1491

1492

1493

1494

1495

1496

1497

1498

1499

1500

1501

1502

1503

1504

1505

1506

1507

1508

1509

1510

1511

1512

1513

1514

1515

1516

1517

1518

1519

1520

1521

1522

1523

1524

1525

1526

1527

1528

1529

1530

1531

1532

importargparse

importasyncio

importatexit

importbase64

importdatetime

importhashlib

importjson

importlogging

importmultiprocessing

importos

importrandom

importre

importshutil

importssl

importsys

importtarfile

importtempfile

fromconcurrent.futuresimportThreadPoolExecutor

fromdataclassesimportdataclass

fromfunctoolsimportcache

fromioimportBytesIO

fromurllib.parseimporturlparse

importboto3

importhttpx

frombotocore.exceptionsimportClientError

fromhuggingface\_hubimportsnapshot\_download

fromPILimportImage

frompypdfimportPdfReader

fromtqdmimporttqdm

fromolmocr.checkimport (

check\_poppler\_version,

check\_torch\_gpu\_available,

)

fromolmocr.data.renderpdfimportrender\_pdf\_to\_base64png

fromolmocr.filter.filterimportLanguage, PdfFilter

fromolmocr.image\_utilsimportconvert\_image\_to\_pdf\_bytes, is\_jpeg, is\_png

fromolmocr.metricsimportMetricsKeeper, WorkerTracker

fromolmocr.promptsimportPageResponse, build\_no\_anchoring\_v4\_yaml\_prompt

fromolmocr.prompts.anchorimportget\_anchor\_text

fromolmocr.s3\_utilsimport (

download\_directory,

download\_zstd\_csv,

expand\_s3\_glob,

get\_s3\_bytes,

get\_s3\_bytes\_with\_backoff,

parse\_s3\_path,

)

fromolmocr.train.front\_matterimportFrontMatterParser

fromolmocr.versionimportVERSION

fromolmocr.work\_queueimportLocalBackend, S3Backend, WorkQueue

\# Initialize logger

logger=logging.getLogger(\_\_name\_\_)

logger.setLevel(logging.DEBUG)

logger.propagate=False

server\_logger=logging.getLogger("vllm")

server\_logger.propagate=False

console\_handler=logging.StreamHandler()

console\_handler.setLevel(logging.INFO)

console\_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))

\# Add console handler to loggers (file handler added later if disk logging enabled)

logger.addHandler(console\_handler)

server\_logger.addHandler(console\_handler)

\# Quiet logs from pypdf

logging.getLogger("pypdf").setLevel(logging.ERROR)

\# Global s3 clients fo the whole script, we have two separate ones in case your workspace and your pdfs are in different accounts

workspace\_s3=boto3.client("s3")

pdf\_s3=boto3.client("s3")

\# Global variables for token statistics

metrics=MetricsKeeper(window=60\*5)

tracker=WorkerTracker()

\# Global variable for vLLM queue status (updated by vllm\_server\_task)

vllm\_queued\_requests=None

\# Temperature values for retry attempts - higher temperature helps overcome repetition issues

TEMPERATURE\_BY\_ATTEMPT= \[0.1, 0.1, 0.2, 0.3, 0.5, 0.8, 0.9, 1.0\]

pdf\_render\_max\_workers\_limit=asyncio.BoundedSemaphore(int(float(os.environ.get("BEAKER\_ASSIGNED\_CPU\_COUNT", max(1, multiprocessing.cpu\_count() -2)))))

max\_concurrent\_requests\_limit=asyncio.BoundedSemaphore(1) \# Actual value set by args in main()

\# Filter object, cached so it will only get loaded when/if you need it

get\_pdf\_filter=cache(lambda: PdfFilter(languages\_to\_keep={Language.ENGLISH, None}, apply\_download\_spam\_check=True, apply\_form\_check=True))

@dataclass(frozen=True)

classPageResult:

s3\_path: str

page\_num: int

response: PageResponse

input\_tokens: int

output\_tokens: int

is\_fallback: bool

is\_valid: bool

asyncdefbuild\_page\_query(local\_pdf\_path: str, page: int, target\_longest\_image\_dim: int, image\_rotation: int=0, model\_name: str="olmocr") ->dict:

MAX\_TOKENS=8000

assertimage\_rotationin \[0, 90, 180, 270\], "Invalid image rotation provided in build\_page\_query"

\# Allow the page rendering to process in the background, but limit the number of workers otherwise you can overload the system

asyncwithpdf\_render\_max\_workers\_limit:

image\_base64=awaitasyncio.to\_thread(render\_pdf\_to\_base64png, local\_pdf\_path, page, target\_longest\_image\_dim=target\_longest\_image\_dim)

ifimage\_rotation!=0:

image\_bytes=base64.b64decode(image\_base64)

withImage.open(BytesIO(image\_bytes)) asimg:

ifimage\_rotation==90:

tranpose=Image.Transpose.ROTATE\_90

elifimage\_rotation==180:

tranpose=Image.Transpose.ROTATE\_180

else:

tranpose=Image.Transpose.ROTATE\_270

rotated\_img=img.transpose(tranpose)

\# Save the rotated image to a bytes buffer

buffered=BytesIO()

rotated\_img.save(buffered, format="PNG")

\# Encode the rotated image back to base64

image\_base64=base64.b64encode(buffered.getvalue()).decode("utf-8")

return {

"model": model\_name,

"messages": \[\
\
{\
\
"role": "user",\
\
"content": \[\
\
{"type": "text", "text": build\_no\_anchoring\_v4\_yaml\_prompt()},\
\
{"type": "image\_url", "image\_url": {"url": f"data:image/png;base64,{image\_base64}"}},\
\
\],\
\
}\
\
\],

"max\_tokens": MAX\_TOKENS,

"temperature": 0.0, \# This will get overridden later

}

asyncdeftry\_single\_page(

args,

pdf\_orig\_path: str,

pdf\_local\_path: str,

page\_num: int,

attempt: int,

rotation: int,

) ->PageResult\|None:

"""

Try processing a single page once. Returns PageResult on success, None on failure.

Does NOT handle retries - caller is responsible for retry logic.

"""

COMPLETION\_URL=f"{args.server.rstrip('/')}/chat/completions"

MODEL\_MAX\_CONTEXT=16384

temp\_idx=min(attempt, len(TEMPERATURE\_BY\_ATTEMPT) -1)

temperature=TEMPERATURE\_BY\_ATTEMPT\[temp\_idx\]

api\_key=args.api\_keyifargs.serverandhasattr(args, "api\_key") elseNone

try:

query=awaitbuild\_page\_query(

pdf\_local\_path,

page\_num,

args.target\_longest\_image\_dim,

image\_rotation=rotation,

model\_name=args.model,

)

query\["temperature"\] =temperature

ifargs.guided\_decoding:

query\["guided\_regex"\] = (

r"---\\nprimary\_language: (?:\[a-z\]{2}\|null)\\nis\_rotation\_valid: (?:True\|False\|true\|false)\\nrotation\_correction: (?:0\|90\|180\|270)\\nis\_table: (?:True\|False\|true\|false)\\nis\_diagram: (?:True\|False\|true\|false)\\n(?:---\|---\\n\[\\s\\S\]+)"

)

asyncwithmax\_concurrent\_requests\_limit:

status\_code, response\_body=awaitapost(COMPLETION\_URL, json\_data=query, api\_key=api\_key)

ifstatus\_code!=200:

logger.warning(

f"Server returned {status\_code} for {pdf\_orig\_path}-{page\_num} attempt {attempt}: {response\_body\[:500\] ifresponse\_bodyelse'empty response'}"

)

returnNone

base\_response\_data=json.loads(response\_body)

metrics.add\_metrics(

server\_input\_tokens=base\_response\_data\["usage"\].get("prompt\_tokens", 0),

server\_output\_tokens=base\_response\_data\["usage"\].get("completion\_tokens", 0),

)

is\_valid=True

ifbase\_response\_data\["usage"\]\["total\_tokens"\] >MODEL\_MAX\_CONTEXT:

is\_valid=False

ifbase\_response\_data\["choices"\]\[0\]\["finish\_reason"\] !="stop":

is\_valid=False

model\_response\_markdown=base\_response\_data\["choices"\]\[0\]\["message"\]\["content"\]

parser=FrontMatterParser(front\_matter\_class=PageResponse)

front\_matter, text=parser.\_extract\_front\_matter\_and\_text(model\_response\_markdown)

page\_response=parser.\_parse\_front\_matter(front\_matter, text)

returnPageResult(

pdf\_orig\_path,

page\_num,

page\_response,

input\_tokens=base\_response\_data\["usage"\].get("prompt\_tokens", 0),

output\_tokens=base\_response\_data\["usage"\].get("completion\_tokens", 0),

is\_fallback=False,

is\_valid=is\_valid,

)

exceptasyncio.CancelledError:

raise

except (ConnectionError, OSError, asyncio.TimeoutError):

\# Re-raise connection errors so caller can apply exponential backoff

raise

exceptExceptionase:

logger.warning(f"try\_single\_page failed for {pdf\_orig\_path}-{page\_num} attempt {attempt}: {type(e).\_\_name\_\_}: {e}")

returnNone

defmake\_fallback\_result(pdf\_orig\_path: str, pdf\_local\_path: str, page\_num: int) ->PageResult:

"""Create a fallback PageResult using pdftotext."""

returnPageResult(

pdf\_orig\_path,

page\_num,

PageResponse(

natural\_text=get\_anchor\_text(pdf\_local\_path, page\_num, pdf\_engine="pdftotext"),

primary\_language=None,

is\_rotation\_valid=True,

rotation\_correction=0,

is\_table=False,

is\_diagram=False,

),

input\_tokens=0,

output\_tokens=0,

is\_fallback=True,

is\_valid=True,

)

asyncdeftry\_single\_page\_with\_backoff(

args,

pdf\_orig\_path: str,

pdf\_local\_path: str,

page\_num: int,

attempt: int,

rotation: int,

) ->PageResult\|None:

"""

Wrapper around try\_single\_page that handles connection errors with exponential backoff.

"""

MAX\_BACKOFF\_ATTEMPTS=10

forbackoff\_countinrange(MAX\_BACKOFF\_ATTEMPTS):

try:

returnawaittry\_single\_page(args, pdf\_orig\_path, pdf\_local\_path, page\_num, attempt, rotation)

except (ConnectionError, OSError, asyncio.TimeoutError) ase:

sleep\_delay=10\* (2\*\*backoff\_count)

logger.warning(

f"Connection error on {pdf\_orig\_path}-{page\_num} attempt {attempt}: {type(e).\_\_name\_\_}: {e}. "

f"Backoff {backoff\_count+1}/{MAX\_BACKOFF\_ATTEMPTS}, sleeping {sleep\_delay}s"

)

awaitasyncio.sleep(sleep\_delay)

logger.error(f"Max backoff attempts reached for {pdf\_orig\_path}-{page\_num}, terminating job")

sys.exit(1)

asyncdefprocess\_page(args, worker\_id: int, pdf\_orig\_path: str, pdf\_local\_path: str, page\_num: int) ->PageResult:

"""

Process a single page with retry logic:

1\. Try first attempt

2\. If success: return result

3\. If rotation error: retry sequentially (need model feedback for rotation correction)

4\. If other error: fire all remaining retries in parallel (if queue empty) or sequential

"""

MAX\_RETRIES=args.max\_page\_retries

retry\_attempts=list(range(1, MAX\_RETRIES))

cumulative\_rotation=0

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "started")

\# === First attempt ===

result=awaittry\_single\_page\_with\_backoff(args, pdf\_orig\_path, pdf\_local\_path, page\_num, attempt=0, rotation=cumulative\_rotation)

ifresultisnotNoneandnotresult.response.is\_rotation\_valid:

cumulative\_rotation=result.response.rotation\_correction%360

\# Success on first try

ifresultisnotNoneandresult.is\_validandresult.response.is\_rotation\_valid:

metrics.add\_metrics(\*\*{"completed\_pages": 1, "finished\_on\_attempt\_0": 1})

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")

returnresult

\# === Rotation error path: sequential retries with model feedback ===

ifresultisnotNoneandnotresult.response.is\_rotation\_valid:

logger.info(f"Rotation error for {pdf\_orig\_path}-{page\_num}, retrying sequentially with rotation={cumulative\_rotation}")

forattemptinretry\_attempts:

result=awaittry\_single\_page\_with\_backoff(args, pdf\_orig\_path, pdf\_local\_path, page\_num, attempt, cumulative\_rotation)

ifresultisnotNoneandresult.is\_validandresult.response.is\_rotation\_valid:

metrics.add\_metrics(\*\*{"completed\_pages": 1, f"finished\_on\_attempt\_{attempt}": 1})

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")

returnresult

ifresultisnotNone: \# Another rotation correction needed

cumulative\_rotation= (cumulative\_rotation+result.response.rotation\_correction) %360

\# If you tried many times and all rotations were invalid, but you at least had a valid response, then return that in the end

ifresultisnotNoneandresult.is\_valid:

metrics.add\_metrics(\*\*{"completed\_pages": 1, f"finished\_on\_attempt\_{MAX\_RETRIES}": 1})

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")

returnresult

\# Otherwise you can do a full fallback

logger.error(f"Failed {pdf\_orig\_path}-{page\_num} after {MAX\_RETRIES} rotation retries")

metrics.add\_metrics(failed\_pages=1)

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "errored")

returnmake\_fallback\_result(pdf\_orig\_path, pdf\_local\_path, page\_num)

\# === Non-rotation error path: sequential, but switch to parallel if queue empties ===

fori, attemptinenumerate(retry\_attempts):

result=awaittry\_single\_page\_with\_backoff(args, pdf\_orig\_path, pdf\_local\_path, page\_num, attempt, rotation=cumulative\_rotation)

ifresultisnotNoneandresult.is\_validandresult.response.is\_rotation\_valid:

metrics.add\_metrics(\*\*{"completed\_pages": 1, f"finished\_on\_attempt\_{attempt}": 1})

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")

returnresult

\# After each failed attempt, check if queue is empty - if so, fire remaining in parallel

remaining\_attempts=retry\_attempts\[i+1 :\]

ifremaining\_attemptsandvllm\_queued\_requests==0:

logger.info(f"Queue empty, firing {len(remaining\_attempts)} parallel retries for {pdf\_orig\_path}-{page\_num}")

tasks= \[\
\
asyncio.create\_task(try\_single\_page\_with\_backoff(args, pdf\_orig\_path, pdf\_local\_path, page\_num, a, rotation=cumulative\_rotation))\
\
forainremaining\_attempts\
\
\]

forcoroinasyncio.as\_completed(tasks):

try:

result=awaitcoro

ifresultisnotNoneandresult.is\_validandresult.response.is\_rotation\_valid:

fortintasks:

t.cancel()

metrics.add\_metrics(\*\*{"completed\_pages": 1, "finished\_on\_parallel\_retry": 1})

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")

returnresult

exceptasyncio.CancelledError:

continue

break\# Parallel attempts exhausted

\# If you tried many times and a least had a valid response, then return that in the end

ifresultisnotNoneandresult.is\_valid:

metrics.add\_metrics(\*\*{"completed\_pages": 1, f"finished\_on\_attempt\_{MAX\_RETRIES}": 1})

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "finished")

returnresult

\# All retries exhausted

logger.error(f"Failed {pdf\_orig\_path}-{page\_num} after {MAX\_RETRIES} attempts")

metrics.add\_metrics(failed\_pages=1)

awaittracker.track\_work(worker\_id, f"{pdf\_orig\_path}-{page\_num}", "errored")

returnmake\_fallback\_result(pdf\_orig\_path, pdf\_local\_path, page\_num)

\# Manual simple implementation of HTTP Post

\# It feels strange perhaps, but httpx and aiohttp are very complex beasts

\# Ex. the sessionpool in httpcore has 4 different locks in it, and I've noticed

\# that at the scale of 100M+ requests, that they deadlock in different strange ways

asyncdefapost(url, json\_data, api\_key=None):

parsed\_url=urlparse(url)

host=parsed\_url.hostname

\# Default to 443 for HTTPS, 80 for HTTP

ifparsed\_url.scheme=="https":

port=parsed\_url.portor443

use\_ssl=True

else:

port=parsed\_url.portor80

use\_ssl=False

path=parsed\_url.pathor"/"

writer=None

try:

ifuse\_ssl:

ssl\_context=ssl.create\_default\_context()

reader, writer=awaitasyncio.open\_connection(host, port, ssl=ssl\_context)

else:

reader, writer=awaitasyncio.open\_connection(host, port)

json\_payload=json.dumps(json\_data)

headers= \[\
\
f"POST {path} HTTP/1.1",\
\
f"Host: {host}",\
\
f"Content-Type: application/json",\
\
f"Content-Length: {len(json\_payload)}",\
\
\]

ifapi\_key:

headers.append(f"Authorization: Bearer {api\_key}")

headers.append("Connection: close")

request="\\r\\n".join(headers) +"\\r\\n\\r\\n"+json\_payload

writer.write(request.encode())

awaitwriter.drain()

status\_line=awaitreader.readline()

ifnotstatus\_line:

raiseConnectionError("No response from server")

status\_parts=status\_line.decode().strip().split(" ", 2)

iflen(status\_parts) <2:

raiseValueError(f"Malformed status line: {status\_line.decode().strip()}")

status\_code=int(status\_parts\[1\])

\# Read headers

headers= {}

whileTrue:

line=awaitreader.readline()

iflinein (b"\\r\\n", b"\\n", b""):

break

key, \_, value=line.decode().partition(":")

headers\[key.strip().lower()\] =value.strip()

\# Read response body

if"content-length"inheaders:

body\_length=int(headers\["content-length"\])

response\_body=awaitreader.readexactly(body\_length)

elifheaders.get("transfer-encoding", "") =="chunked":

chunks= \[\]

whileTrue:

\# Read chunk size line

size\_line=awaitreader.readline()

chunk\_size=int(size\_line.strip(), 16) \# Hex format

ifchunk\_size==0:

awaitreader.readline() \# Read final CRLF

break

chunk\_data=awaitreader.readexactly(chunk\_size)

chunks.append(chunk\_data)

\# Read trailing CRLF after chunk data

awaitreader.readline()

response\_body=b"".join(chunks)

elifheaders.get("connection", "") =="close":

\# Read until connection closes

response\_body=awaitreader.read()

else:

raiseConnectionError("Cannot determine response body length")

returnstatus\_code, response\_body

exceptExceptionase:

\# Pass through errors

raisee

finally:

\# But just make sure to close the socket on your way out

ifwriterisnotNone:

try:

writer.close()

awaitwriter.wait\_closed()

except:

pass

defis\_tarball\_path(path: str) ->bool:

"""Check if a path is a tarball based on extension."""

lower=path.lower()

returnlower.endswith(".tar.gz") orlower.endswith(".tgz")

asyncdefprocess\_tarball(args, worker\_id: int, tarball\_path: str) ->list:

"""Process all PDFs inside a tarball concurrently and return list of Dolma documents."""

logger.info(f"Worker {worker\_id} processing tarball {tarball\_path}")

tarball\_bytes=awaitasyncio.to\_thread(lambda: get\_s3\_bytes\_with\_backoff(pdf\_s3, tarball\_path))

\# Extract all PDFs to a temp directory

temp\_dir=tempfile.mkdtemp()

try:

pdf\_files= \[\] \# (source\_path, local\_path)

withtarfile.open(fileobj=BytesIO(tarball\_bytes), mode="r:gz") astar:

formemberintar.getmembers():

ifmember.isfile() andmember.name.lower().endswith(".pdf"):

local\_path=os.path.join(temp\_dir, os.path.basename(member.name))

withopen(local\_path, "wb") asf:

extracted=tar.extractfile(member)

ifextracted:

f.write(extracted.read())

pdf\_files.append((f"{tarball\_path}::{member.name}", local\_path))

logger.info(f"Worker {worker\_id} extracted {len(pdf\_files)} PDFs from {tarball\_path}")

\# Process all PDFs concurrently

asyncwithasyncio.TaskGroup() astg:

tasks= \[tg.create\_task(process\_single\_pdf(args, worker\_id, src, local)) forsrc, localinpdf\_files\]

dolma\_docs= \[t.result() fortintasksift.result() isnotNone\]

logger.info(f"Worker {worker\_id} processed {len(dolma\_docs)} PDFs from tarball {tarball\_path}")

returndolma\_docs

finally:

shutil.rmtree(temp\_dir, ignore\_errors=True)

asyncdefprocess\_single\_pdf(args, worker\_id: int, pdf\_orig\_path: str, local\_pdf\_path: str):

"""Process a single PDF that's already on disk.

Args:

args: Pipeline arguments

worker\_id: Worker ID for logging

pdf\_orig\_path: Original path (for metadata, can be tarball::internal format)

local\_pdf\_path: Local path to the PDF file

Returns:

Dolma document or None

"""

try:

try:

reader=PdfReader(local\_pdf\_path)

num\_pages=reader.get\_num\_pages()

except:

logger.exception(f"Could not count number of pages for {pdf\_orig\_path}, aborting document")

returnNone

logger.debug(f"Got {num\_pages} pages to do for {pdf\_orig\_path} in worker {worker\_id}")

ifargs.apply\_filterandget\_pdf\_filter().filter\_out\_pdf(local\_pdf\_path):

logger.info(f"Filtering out pdf {pdf\_orig\_path}")

returnNone

\# List to hold the tasks for processing each page

page\_tasks= \[\]

page\_results= \[\]

asyncwithasyncio.TaskGroup() astg:

forpage\_numinrange(1, num\_pages+1):

task=tg.create\_task(process\_page(args, worker\_id, pdf\_orig\_path, local\_pdf\_path, page\_num))

page\_tasks.append(task)

\# Collect the results from the entire task group, assuming no exceptions, if there is an exception propagated to this point in any page, it will abort the PDF itself

page\_results= \[task.result() fortaskinpage\_tasks\]

assertall(page\_result.is\_validforpage\_resultinpage\_results)

num\_fallback\_pages=sum(page\_result.is\_fallbackforpage\_resultinpage\_results)

ifnum\_fallback\_pages/num\_pages>args.max\_page\_error\_rate:

logger.error(

f"Document {pdf\_orig\_path} has {num\_fallback\_pages} fallback pages out of {num\_pages} exceeding max\_page\_error\_rate of {args.max\_page\_error\_rate}, discarding document."

)

returnNone

elifnum\_fallback\_pages>0:

logger.warning(

f"Document {pdf\_orig\_path} processed with {num\_fallback\_pages} fallback pages out of {num\_pages}, proceeding to build Dolma document."

)

returnbuild\_dolma\_document(pdf\_orig\_path, page\_results)

exceptExceptionase:

logger.exception(f"Exception in process\_single\_pdf for {pdf\_orig\_path}: {e}")

returnNone

asyncdefprocess\_pdf(args, worker\_id: int, pdf\_orig\_path: str):

"""Process a single PDF from S3/local path and return a Dolma document."""

withtempfile.NamedTemporaryFile("wb+", suffix=".pdf", delete=False) astf:

try:

data=awaitasyncio.to\_thread(lambda: get\_s3\_bytes\_with\_backoff(pdf\_s3, pdf\_orig\_path))

tf.write(data)

tf.flush()

exceptClientErrorasex:

ifex.response\["Error"\]\["Code"\] =="NoSuchKey":

logger.info(f"S3 File Not found, skipping it completely {pdf\_orig\_path}")

returnNone

else:

raise

ifis\_png(tf.name) oris\_jpeg(tf.name):

logger.info(f"Converting {pdf\_orig\_path} from image to PDF format...")

tf.seek(0)

tf.write(convert\_image\_to\_pdf\_bytes(tf.name))

tf.flush()

try:

returnawaitprocess\_single\_pdf(args, worker\_id, pdf\_orig\_path, tf.name)

finally:

ifos.path.exists(tf.name):

os.unlink(tf.name)

defbuild\_dolma\_document(pdf\_orig\_path, page\_results):

\# Build the document text and page spans

document\_text=""

pdf\_page\_spans= \[\]

current\_char\_pos=0

forindex, page\_resultinenumerate(page\_results):

ifpage\_result.response.natural\_textisnotNone:

content=page\_result.response.natural\_text+ ("\\n"ifindex<len(page\_results) -1else"")

else:

content=""

start\_pos=current\_char\_pos

document\_text+=content

current\_char\_pos=len(document\_text)

pdf\_page\_spans.append(\[start\_pos, current\_char\_pos, page\_result.page\_num\])

ifnotdocument\_text:

logger.info(f"No document text for {pdf\_orig\_path}")

returnNone\# Return None if the document text is empty

\# Build the Dolma document

metadata= {

"Source-File": pdf\_orig\_path,

"olmocr-version": VERSION,

"pdf-total-pages": len(page\_results),

"total-input-tokens": sum(page.input\_tokensforpageinpage\_results),

"total-output-tokens": sum(page.output\_tokensforpageinpage\_results),

"total-fallback-pages": sum(page.is\_fallbackforpageinpage\_results),

}

id\_=hashlib.sha1(document\_text.encode()).hexdigest()

dolma\_doc= {

"id": id\_,

"text": document\_text,

"source": "olmocr",

"added": datetime.datetime.now().strftime("%Y-%m-%d"),

"created": datetime.datetime.now().strftime("%Y-%m-%d"),

"metadata": metadata,

"attributes": {

"pdf\_page\_numbers": pdf\_page\_spans,

"primary\_language": \[p.response.primary\_languageforpinpage\_results\],

"is\_rotation\_valid": \[p.response.is\_rotation\_validforpinpage\_results\],

"rotation\_correction": \[p.response.rotation\_correctionforpinpage\_results\],

"is\_table": \[p.response.is\_tableforpinpage\_results\],

"is\_diagram": \[p.response.is\_diagramforpinpage\_results\],

},

}

returndolma\_doc

defget\_markdown\_path(workspace: str, source\_file: str) ->str:

"""

Calculate the markdown output path for a given source file.

Args:

workspace: The workspace directory path

source\_file: The original source file path (can be S3, local, or tarball::internal\_path)

Returns:

The full path where the markdown file should be written

"""

\# Handle tarball paths (format: tarball\_path::internal\_path)

if"::"insource\_file:

tarball\_path, internal\_path=source\_file.split("::", 1)

\# Use tarball basename + internal path structure

tarball\_basename=os.path.splitext(os.path.basename(tarball\_path))\[0\]

iftarball\_basename.endswith(".tar"):

tarball\_basename=tarball\_basename\[:-4\]

relative\_path=os.path.join(tarball\_basename, internal\_path)

elifsource\_file.startswith("s3://"):

\# Extract the path after the bucket name for S3 sources

parsed=urlparse(source\_file)

relative\_path=parsed.path.lstrip("/")

else:

\# For local files, strip leading slash to make it relative

relative\_path=source\_file.lstrip("/")

\# Sanitize path: remove any .. components to prevent path traversal

parts=relative\_path.split("/")

safe\_parts= \[pforpinpartsifpandp!=".."\]

relative\_path="/".join(safe\_parts)

\# Change the extension to .md

md\_filename=os.path.splitext(os.path.basename(relative\_path))\[0\] +".md"

\# Get the directory path without the filename

dir\_path=os.path.dirname(relative\_path)

\# Create the output markdown path

markdown\_dir=os.path.join(workspace, "markdown", dir\_path)

markdown\_path=os.path.join(markdown\_dir, md\_filename)

returnmarkdown\_path

asyncdefworker(args, work\_queue: WorkQueue, worker\_id):

whileTrue:

work\_item=awaitwork\_queue.get\_work()

ifwork\_itemisNone:

logger.info(f"Worker {worker\_id} exiting due to empty queue")

break

logger.info(f"Worker {worker\_id} processing work item {work\_item.hash}")

awaittracker.clear\_work(worker\_id)

try:

asyncwithasyncio.TaskGroup() astg:

dolma\_tasks= \[\]

forpathinwork\_item.work\_paths:

ifis\_tarball\_path(path):

\# Tarball returns a list of docs, so we handle it specially

dolma\_tasks.append(tg.create\_task(process\_tarball(args, worker\_id, path)))

else:

dolma\_tasks.append(tg.create\_task(process\_pdf(args, worker\_id, path)))

logger.info(f"Created all tasks for {work\_item.hash}")

logger.info(f"Finished TaskGroup for worker on {work\_item.hash}")

dolma\_docs= \[\]

fortaskindolma\_tasks:

try:

result=task.result()

except:

\# some dolma doc creations may have failed

result=None

ifresultisNone:

continue

\# process\_tarball returns a list, process\_pdf returns a single doc

ifisinstance(result, list):

dolma\_docs.extend(result)

else:

dolma\_docs.append(result)

logger.info(f"Got {len(dolma\_docs)} docs for {work\_item.hash}")

\# Write the Dolma documents to a local temporary file in JSONL format

withtempfile.NamedTemporaryFile(mode="w+", delete=False) astf:

fordocindolma\_docs:

tf.write(json.dumps(doc))

tf.write("\\n")

tf.flush()

temp\_path=tf.name

try:

\# Define the output S3 path using the work\_hash

output\_final\_path=os.path.join(args.workspace, "results", f"output\_{work\_item.hash}.jsonl")

ifoutput\_final\_path.startswith("s3://"):

bucket, key=parse\_s3\_path(output\_final\_path)

workspace\_s3.upload\_file(temp\_path, bucket, key)

else:

\# Ensure the results directory exists for local workspace

os.makedirs(os.path.dirname(output\_final\_path), exist\_ok=True)

shutil.copyfile(temp\_path, output\_final\_path)

finally:

\# Clean up the temporary file

ifos.path.exists(temp\_path):

os.unlink(temp\_path)

\# If --markdown flag is set, also write the natural text to markdown files

ifargs.markdown:

logger.info(f"Writing {len(dolma\_docs)} markdown files for {work\_item.hash}")

fordocindolma\_docs:

source\_file=doc\["metadata"\]\["Source-File"\]

natural\_text=doc\["text"\]

markdown\_path=get\_markdown\_path(args.workspace, source\_file)

markdown\_dir=os.path.dirname(markdown\_path)

\# Create the directory structure if it doesn't exist

ifmarkdown\_path.startswith("s3://"):

\# For S3 paths, we'll create a temporary file and upload it

withtempfile.NamedTemporaryFile(mode="w+", delete=False) asmd\_tf:

md\_tf.write(natural\_text)

md\_tf.flush()

md\_temp\_path=md\_tf.name

try:

md\_bucket, md\_key=parse\_s3\_path(markdown\_path)

workspace\_s3.upload\_file(md\_temp\_path, md\_bucket, md\_key)

finally:

\# Make sure to clean up the temporary file even if upload fails

ifos.path.exists(md\_temp\_path):

os.unlink(md\_temp\_path)

else:

\# For local paths, create the directory structure and write the file

os.makedirs(markdown\_dir, exist\_ok=True)

withopen(markdown\_path, "w") asmd\_f:

md\_f.write(natural\_text)

\# Update finished token counts from successful documents

metrics.add\_metrics(

finished\_input\_tokens=sum(doc\["metadata"\]\["total-input-tokens"\] fordocindolma\_docs),

finished\_output\_tokens=sum(doc\["metadata"\]\["total-output-tokens"\] fordocindolma\_docs),

)

awaitwork\_queue.mark\_done(work\_item)

exceptExceptionase:

logger.exception(f"Exception occurred while processing work\_hash {work\_item.hash}: {e}")

asyncdefvllm\_server\_task(model\_name\_or\_path, args, unknown\_args=None):

cmd= \[\
\
"vllm",\
\
"serve",\
\
model\_name\_or\_path,\
\
"--port",\
\
str(args.port),\
\
"--disable-log-requests",\
\
"--uvicorn-log-level",\
\
"warning",\
\
"--served-model-name",\
\
"olmocr",\
\
"--tensor-parallel-size",\
\
str(args.tensor\_parallel\_size),\
\
"--data-parallel-size",\
\
str(args.data\_parallel\_size),\
\
"--limit-mm-per-prompt",\
\
'{"video": 0}', \# Disabling video encoder saves RAM that you can put towards the KV cache, thanks @charitarthchugh\
\
\]

ifargs.gpu\_memory\_utilizationisnotNone:

cmd.extend(\["--gpu-memory-utilization", str(args.gpu\_memory\_utilization)\])

ifargs.max\_model\_lenisnotNone:

cmd.extend(\["--max-model-len", str(args.max\_model\_len)\])

ifunknown\_args:

cmd.extend(unknown\_args)

proc=awaitasyncio.create\_subprocess\_exec(

\*cmd,

stdout=asyncio.subprocess.PIPE,

stderr=asyncio.subprocess.PIPE,

\# OMP\_NUM\_THREADS needs to be 1, otherwise you could have contention if you are running multiple copies of olmOCR on a machine with several GPUS

env={\*\*os.environ, "OMP\_NUM\_THREADS": "1"},

)

\# Ensure the subprocess is terminated on exit

def\_kill\_proc():

try:

proc.terminate()

except:

logger.info("VLLM Process already terminated")

atexit.register(\_kill\_proc)

\# Shared variables between tasks

last\_running\_req, peak\_running\_req, last\_queue\_req=0, 0, 0

server\_printed\_ready\_message=False

asyncdefprocess\_line(line):

nonlocallast\_running\_req, last\_queue\_req, peak\_running\_req, server\_printed\_ready\_message

server\_logger.info(line)

if"Detected errors during sampling"inline:

logger.error("Cannot continue, sampling errors detected, model is probably corrupt")

sys.exit(1)

ifnotserver\_printed\_ready\_messageand ("The server is fired up and ready to roll!"inlineor"Starting vLLM API server"inline):

server\_printed\_ready\_message=True

ifmatch:=re.search(r"Running: (\\d+)", line):

current\_running=int(match.group(1))

\# Track peak running requests

ifcurrent\_running>peak\_running\_req:

peak\_running\_req=current\_running

logger.info(f"New peak running requests: {peak\_running\_req}")

last\_running\_req=current\_running

ifmatch:=re.search(r"(?:Waiting\|Pending):\\s\*(\\d+)", line):

globalvllm\_queued\_requests

last\_queue\_req=int(match.group(1))

vllm\_queued\_requests=last\_queue\_req

logger.info(f"vllm running req: {last\_running\_req} queue req: {last\_queue\_req}")

asyncdefread\_stream(stream):

whileTrue:

line=awaitstream.readline()

ifnotline:

break

try:

line=line.decode("utf-8").rstrip()

awaitprocess\_line(line)

exceptExceptionasex:

logger.warning(f"Got {ex} when reading log line from inference server, skipping")

\# Start tasks to read stdout, stderr, and handle timeout logic

stdout\_task=asyncio.create\_task(read\_stream(proc.stdout))

stderr\_task=asyncio.create\_task(read\_stream(proc.stderr))

try:

awaitproc.wait()

exceptasyncio.CancelledError:

logger.info("Got cancellation request for VLLM server")

proc.terminate()

try:

awaitasyncio.wait\_for(proc.wait(), timeout=10.0)

exceptasyncio.TimeoutError:

logger.warning("VLLM server did not terminate within 10 seconds")

raise

awaitasyncio.gather(stdout\_task, stderr\_task, return\_exceptions=True)

asyncdefvllm\_server\_host(model\_name\_or\_path, args, unknown\_args=None):

MAX\_RETRIES=5

retry=0

whileretry<MAX\_RETRIES:

awaitvllm\_server\_task(model\_name\_or\_path, args, unknown\_args)

logger.warning("VLLM server task ended")

retry+=1

ifretry>=MAX\_RETRIES:

logger.error(f"Ended up starting the vllm server more than {retry} times, cancelling pipeline")

logger.error("")

logger.error(

"Please make sure vllm is installed according to the latest instructions here: https://docs.vllm.ai/en/stable/getting\_started/installation/gpu.html"

)

sys.exit(1)

asyncdefvllm\_server\_ready(args):

max\_attempts=args.max\_server\_ready\_timeout

delay\_sec=1

url=f"{args.server.rstrip('/')}/models"

forattemptinrange(1, max\_attempts+1):

try:

headers= {}

ifargs.serverandhasattr(args, "api\_key") andargs.api\_key:

headers\["Authorization"\] =f"Bearer {args.api\_key}"

asyncwithhttpx.AsyncClient() assession:

response=awaitsession.get(url, headers=headers)

ifresponse.status\_code==200:

logger.info("vllm server is ready.")

return

else:

logger.info(f"Attempt {attempt}: Unexpected status code {response.status\_code}")

exceptException:

logger.warning(f"Attempt {attempt}: Please wait for vllm server to become ready...")

awaitasyncio.sleep(delay\_sec)

raiseException("vllm server did not become ready after waiting.")

asyncdefdownload\_model(model\_name\_or\_path: str, max\_retries: int=5):

forretryinrange(max\_retries):

try:

ifmodel\_name\_or\_path.startswith("s3://") ormodel\_name\_or\_path.startswith("gs://") ormodel\_name\_or\_path.startswith("weka://"):

logger.info(f"Downloading model directory from '{model\_name\_or\_path}'")

model\_cache\_dir=os.path.join(os.path.expanduser("~"), ".cache", "olmocr", "model")

\# Delete existing model cache directory if it exists

ifos.path.exists(model\_cache\_dir):

shutil.rmtree(model\_cache\_dir)

download\_directory(\[model\_name\_or\_path\], model\_cache\_dir)

returnmodel\_cache\_dir

elifos.path.isabs(model\_name\_or\_path) andos.path.isdir(model\_name\_or\_path):

logger.info(f"Using local model path at '{model\_name\_or\_path}'")

returnmodel\_name\_or\_path

else:

logger.info(f"Downloading model with hugging face '{model\_name\_or\_path}'")

snapshot\_download(repo\_id=model\_name\_or\_path)

returnmodel\_name\_or\_path

exceptException:

ifretry==max\_retries-1:

raise\# Raise on final attempt and fail the job

sleep\_time=random.randrange(2, 20) \*2\*\*retry

logger.exception(f"Could not download model, sleeping for {sleep\_time} seconds to retry ({retry+1}/{max\_retries})")

awaitasyncio.sleep(random.randrange(10, 30) \*2\*\*retry)

asyncdefmetrics\_reporter(work\_queue):

whileTrue:

\# Leading newlines preserve table formatting in logs

logger.info(f"Queue remaining: {work\_queue.size}")

logger.info("\\n"+str(metrics))

logger.info("\\n"+str(awaittracker.get\_status\_table()))

awaitasyncio.sleep(10)

defsubmit\_beaker\_job(args):

frombeakerimport ( \# type: ignore

Beaker,

BeakerConstraints,

BeakerEnvVar,

BeakerExperimentSpec,

BeakerImageSource,

BeakerJobPriority,

BeakerResultSpec,

BeakerRetrySpec,

BeakerTaskContext,

BeakerTaskResources,

BeakerTaskSpec,

)

frombeaker.exceptionsimportBeakerSecretNotFound

Beaker.TIMEOUT=60

b=Beaker.from\_env(default\_workspace=args.beaker\_workspace)

owner=b.user\_name

beaker\_image=f"jakep/olmocr-inference-{VERSION}"

task\_name=f"olmocr-{os.path.basename(args.workspace.rstrip('/'))}"

\# Take out --beaker flag so the workers will just run things

args\_list= \[argforarginsys.argv\[1:\] ifarg!="--beaker"\]

\# Take out the --pdfs \[arg\] or --pdfs=\[arg\], since the queue is populated locally

args\_list= \[argfori, arginenumerate(args\_list) ifnot (arg.startswith("--pdfs") or (i>0andargs\_list\[i-1\] =="--pdfs"))\]

try:

b.secret.get(f"{owner}-WEKA\_ACCESS\_KEY\_ID")

b.secret.get(f"{owner}-WEKA\_SECRET\_ACCESS\_KEY")

b.secret.get(f"{owner}-AWS\_CREDENTIALS\_FILE")

exceptBeakerSecretNotFound:

print(

f"Expected beaker secrets for accessing Weka and S3 are not found. Are you okay to write those to your beaker workspace {args.beaker\_workspace}? \[y/n\]"

)

ifinput().strip().lower() !="y":

print("Exiting...")

sys.exit(1)

b.secret.write(f"{owner}-WEKA\_ACCESS\_KEY\_ID", os.environ.get("WEKA\_ACCESS\_KEY\_ID", ""))

b.secret.write(f"{owner}-WEKA\_SECRET\_ACCESS\_KEY", os.environ.get("WEKA\_SECRET\_ACCESS\_KEY", ""))

b.secret.write(

f"{owner}-AWS\_CREDENTIALS\_FILE",

open(os.path.join(os.path.expanduser("~"), ".aws", "credentials")).read(),

)

env\_var\_secrets= \[\
\
BeakerEnvVar(name="WEKA\_ACCESS\_KEY\_ID", secret=f"{owner}-WEKA\_ACCESS\_KEY\_ID"),\
\
BeakerEnvVar(name="WEKA\_SECRET\_ACCESS\_KEY", secret=f"{owner}-WEKA\_SECRET\_ACCESS\_KEY"),\
\
BeakerEnvVar(name="AWS\_CREDENTIALS\_FILE", secret=f"{owner}-AWS\_CREDENTIALS\_FILE"),\
\
\]

try:

b.secret.get("OLMOCR\_PREVIEW\_HF\_TOKEN")

env\_var\_secrets.append(BeakerEnvVar(name="HF\_TOKEN", secret="OLMOCR\_PREVIEW\_HF\_TOKEN"))

exceptBeakerSecretNotFound:

pass

try:

b.secret.get("OE\_DATA\_GCS\_SA\_KEY")

env\_var\_secrets.append(BeakerEnvVar(name="GOOGLE\_APPLICATION\_CREDENTIALS\_FILE", secret="OE\_DATA\_GCS\_SA\_KEY"))

exceptBeakerSecretNotFound:

print("Input the olmo-gcs SA key if you would like to load weights from gcs (end with a double newline):")

lines= \[\]

prev\_empty=False

forlineiniter(input, None):

ifnotlineandprev\_empty:

break

prev\_empty=notline

lines.append(line)

gcs\_sa\_key="\\n".join(lines\[:-1\]).strip() \# Remove the last empty line

ifgcs\_sa\_key:

b.secret.write("OE\_DATA\_GCS\_SA\_KEY", gcs\_sa\_key)

env\_var\_secrets.append(BeakerEnvVar(name="GOOGLE\_APPLICATION\_CREDENTIALS\_FILE", secret="OE\_DATA\_GCS\_SA\_KEY"))

\# Create the experiment spec

experiment\_spec=BeakerExperimentSpec(

budget="ai2/oe-base",

description=task\_name,

tasks=\[\
\
BeakerTaskSpec(\
\
name=task\_name,\
\
propagate\_failure=False,\
\
propagate\_preemption=False,\
\
replicas=args.beaker\_gpus,\
\
context=BeakerTaskContext(\
\
priority=BeakerJobPriority\[args.beaker\_priority\],\
\
preemptible=True,\
\
),\
\
image=BeakerImageSource(beaker=beaker\_image),\
\
command=\["python", "-m", "olmocr.pipeline"\] +args\_list,\
\
env\_vars=\[\
\
BeakerEnvVar(name="BEAKER\_JOB\_NAME", value=task\_name),\
\
BeakerEnvVar(name="OWNER", value=owner),\
\
BeakerEnvVar(name="HF\_HUB\_OFFLINE", value="1"),\
\
\]\
\
+env\_var\_secrets,\
\
resources=BeakerTaskResources(gpu\_count=1, memory="125GB"), \# Have to set a memory limit, otherwise VLLM may use too much on its own\
\
constraints=BeakerConstraints(cluster=args.beaker\_clusterifisinstance(args.beaker\_cluster, list) else \[args.beaker\_cluster\]),\
\
result=BeakerResultSpec(path="/noop-results"),\
\
)\
\
\],

retry=BeakerRetrySpec(allowed\_task\_retries=10),

)

workload=b.experiment.create(spec=experiment\_spec)

print(f"Experiment URL: https://beaker.org/ex/{workload.experiment.id}")

defprint\_stats(args, root\_work\_queue):

LONG\_CONTEXT\_THRESHOLD=32768

assertargs.workspace.startswith("s3://"), "Printing stats functionality only works with s3 workspaces for now."

done\_work\_items=expand\_s3\_glob(workspace\_s3, os.path.join(args.workspace, "results", "\*.jsonl"))

work\_queue\_lines=download\_zstd\_csv(workspace\_s3, os.path.join(args.workspace, "work\_index\_list.csv.zstd"))

work\_queue= {parts\[0\]: parts\[1:\] forlineinwork\_queue\_linesifline.strip() and (parts:=root\_work\_queue.\_decode\_csv\_row(line.strip()))}

total\_items, completed\_items=len(work\_queue), len(done\_work\_items)

defprocess\_output\_file(s3\_path):

try:

stats= {

"docs": 0,

"input\_tokens": 0,

"output\_tokens": 0,

"pages": 0,

"fallback\_pages": 0,

"long\_docs": 0,

"long\_tokens": 0,

"en\_docs": 0,

"en\_tokens": 0,

}

paths=set()

forlineinget\_s3\_bytes(workspace\_s3, s3\_path).decode("utf-8").splitlines():

ifnotline.strip():

continue

doc=json.loads(line)

meta, attrs=doc\["metadata"\], doc.get("attributes", {})

out\_tokens=meta.get("total-output-tokens", 0)

stats\["docs"\] +=1

stats\["input\_tokens"\] +=meta.get("total-input-tokens", 0)

stats\["output\_tokens"\] +=out\_tokens

stats\["pages"\] +=meta.get("pdf-total-pages", 0)

stats\["fallback\_pages"\] +=meta.get("total-fallback-pages", 0)

paths.add(meta\["Source-File"\])

ifout\_tokens>LONG\_CONTEXT\_THRESHOLD:

stats\["long\_docs"\] +=1

stats\["long\_tokens"\] +=out\_tokens

langs=attrs.get("primary\_language", \[\])

iflangsandsum(1forlninlangsifln=="en") >len(langs) /2:

stats\["en\_docs"\] +=1

stats\["en\_tokens"\] +=out\_tokens

returnstats, paths

exceptExceptionase:

logger.warning(f"Error processing {s3\_path}: {e}")

return {

k: 0forkin \["docs", "input\_tokens", "output\_tokens", "pages", "fallback\_pages", "long\_docs", "long\_tokens", "en\_docs", "en\_tokens"\]

}, set()

print(f"\\nCompleted work items {completed\_items:,} out of {total\_items:,}: {completed\_items/total\_items\*100:.2f}%")

print("\\nProcessing output files...")

totals= {"docs": 0, "input\_tokens": 0, "output\_tokens": 0, "pages": 0, "fallback\_pages": 0, "long\_docs": 0, "long\_tokens": 0, "en\_docs": 0, "en\_tokens": 0}

all\_processed, original\_paths=set(), set()

foritemindone\_work\_items:

if (match:=re.search(r"output\_(\\w+).jsonl", item)) andmatch.group(1) inwork\_queue:

original\_paths.update(work\_queue\[match.group(1)\])

withThreadPoolExecutor() asexecutor:

forstats, pathsintqdm(executor.map(process\_output\_file, done\_work\_items), total=len(done\_work\_items)):

forkintotals:

totals\[k\] +=stats\[k\]

all\_processed.update(paths)

d, p, o, c=totals\["docs"\], totals\["pages"\], totals\["output\_tokens"\], max(1, completed\_items)

print(f"""

Work Items Status:

Total work items: {total\_items:,}

Completed items: {completed\_items:,}

Remaining items: {total\_items-completed\_items:,}

Results:

Total documents processed: {d:,}

Total documents skipped: {len(original\_paths-all\_processed):,}

Total pages on fallback: {totals\['fallback\_pages'\]:,}

Total pages processed: {p:,}

Total output tokens: {o:,}

Projected output tokens: {round(o/c\*total\_items):,}

Average pages per doc: {p/max(1, d):,.1f}

Average output tokens per doc: {o/max(1, d):,.1f}

Average output tokens per page: {o/max(1, p):,.1f}

Long Context Documents (>{LONG\_CONTEXT\_THRESHOLD} tokens): {totals\['long\_docs'\]:,}

Total tokens in long context documents: {totals\['long\_tokens'\]:,}

English-only documents (>50% pages with 'en'): {totals\['en\_docs'\]:,}

Total output tokens in English-only documents: {totals\['en\_tokens'\]:,}

Projected English-only output tokens: {round(totals\['en\_tokens'\] /c\*total\_items):,}""")

asyncdefmain():

parser=argparse.ArgumentParser(description="Manager for running millions of PDFs through a batch inference pipeline.")

parser.add\_argument(

"workspace",

help="The filesystem path where work will be stored, can be a local folder, or an s3 path if coordinating work with many workers, s3://bucket/prefix/ ",

)

parser.add\_argument(

"--pdfs",

nargs="\*",

help="Path to add pdfs stored in s3 to the workspace, can be a glob path s3://bucket/prefix/\*.pdf or path to file containing list of pdf paths",

default=None,

)

parser.add\_argument(

"--model",

help="Path where the model is located, allenai/olmOCR-2-7B-1025-FP8 is the default, can be local, s3, or hugging face.",

default="allenai/olmOCR-2-7B-1025-FP8",

)

\# More detailed config options, usually you shouldn't have to change these

parser.add\_argument("--workspace\_profile", help="S3 configuration profile for accessing the workspace", default=None)

parser.add\_argument("--pdf\_profile", help="S3 configuration profile for accessing the raw pdf documents", default=None)

parser.add\_argument("--pages\_per\_group", type=int, default=argparse.SUPPRESS, help="Aiming for this many pdf pages per work item group")

parser.add\_argument("--max\_page\_retries", type=int, default=8, help="Max number of times we will retry rendering a page")

parser.add\_argument("--max\_page\_error\_rate", type=float, default=0.004, help="Rate of allowable failed pages in a document, 1/250 by default")

parser.add\_argument("--workers", type=int, default=20, help="Number of workers to run at a time")

parser.add\_argument("--max\_concurrent\_requests", type=int, default=1600, help="Max number of concurrent VLLM server requests at a time.")

parser.add\_argument("--max\_server\_ready\_timeout", type=int, default=600, help="Number of seconds to wait for vllm to become ready before exiting.")

parser.add\_argument("--apply\_filter", action="store\_true", help="Apply basic filtering to English pdfs which are not forms, and not likely seo spam")

parser.add\_argument("--stats", action="store\_true", help="Instead of running any job, reports some statistics about the current workspace")

parser.add\_argument("--markdown", action="store\_true", help="Also write natural text to markdown files preserving the folder structure of the input pdfs")

parser.add\_argument("--target\_longest\_image\_dim", type=int, help="Dimension on longest side to use for rendering the pdf pages", default=1288)

parser.add\_argument("--target\_anchor\_text\_len", type=int, help="Maximum amount of anchor text to use (characters), not used for new models", default=-1)

parser.add\_argument("--guided\_decoding", action="store\_true", help="Enable guided decoding for model YAML type outputs")

parser.add\_argument(

"--disk\_logging",

type=str,

nargs="?",

const="olmocr-pipeline-debug.log",

default=None,

help="Enable writing logs to disk, optionally specify filename (default: olmocr-pipeline-debug.log)",

)

server\_group=parser.add\_argument\_group("Server arguments, to specify where your VLLM inference engine is running")

server\_group.add\_argument(

"--server",

type=str,

help="URL of external vLLM (or other compatible provider) server (e.g., http://hostname:port/v1). If provided, skips spawning local vLLM instance",

)

server\_group.add\_argument("--api\_key", type=str, default=None, help="API key for authenticated remote servers (e.g., DeepInfra)")

vllm\_group=parser.add\_argument\_group(

"VLLM arguments", "These arguments are passed to vLLM. Any unrecognized arguments are also automatically forwarded to vLLM."

)

vllm\_group.add\_argument(

"--gpu-memory-utilization", type=float, help="Fraction of VRAM vLLM may pre-allocate for KV-cache ""(passed through to vllm serve)."

)

vllm\_group.add\_argument("--max\_model\_len", type=int, default=16384, help="Upper bound (tokens) vLLM will allocate KV-cache for, lower if VLLM won't start")

vllm\_group.add\_argument("--tensor-parallel-size", "-tp", type=int, default=1, help="Tensor parallel size for vLLM")

vllm\_group.add\_argument("--data-parallel-size", "-dp", type=int, default=1, help="Data parallel size for vLLM")

vllm\_group.add\_argument("--port", type=int, default=30024, help="Port to use for the VLLM server")

\# Beaker/job running stuff

beaker\_group=parser.add\_argument\_group("beaker/cluster execution")

beaker\_group.add\_argument("--beaker", action="store\_true", help="Submit this job to beaker instead of running locally")

beaker\_group.add\_argument("--beaker\_workspace", help="Beaker workspace to submit to", default="ai2/olmocr")

beaker\_group.add\_argument(

"--beaker\_cluster",

help="Beaker clusters you want to run on",

default=\["ai2/jupiter", "ai2/ceres", "ai2/neptune", "ai2/saturn"\],

)

beaker\_group.add\_argument("--beaker\_gpus", type=int, default=1, help="Number of gpu replicas to run")

beaker\_group.add\_argument("--beaker\_priority", type=str, default="normal", help="Beaker priority level for the job")

args, unknown\_args=parser.parse\_known\_args()

\# Set up file logging if enabled

ifargs.disk\_logging:

file\_handler=logging.FileHandler(args.disk\_logging, mode="a")

file\_handler.setLevel(logging.DEBUG)

file\_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))

logger.addHandler(file\_handler)

server\_logger.addHandler(file\_handler)

logger.info(

"If you run out of GPU memory during start-up or get 'KV cache is larger than available memory' errors, retry with lower values, e.g. --gpu\_memory\_utilization 0.80 --max\_model\_len 16384"

)

use\_internal\_server=notargs.server

globalworkspace\_s3, pdf\_s3, max\_concurrent\_requests\_limit

max\_concurrent\_requests\_limit=asyncio.BoundedSemaphore(args.max\_concurrent\_requests)

\# setup the job to work in beaker environment, load secrets, adjust logging, etc.

if"BEAKER\_JOB\_NAME"inos.environ:

cred\_path=os.path.join(os.path.expanduser("~"), ".aws", "credentials")

os.makedirs(os.path.dirname(cred\_path), exist\_ok=True)

withopen(cred\_path, "w") asf:

f.write(os.environ.get("AWS\_CREDENTIALS\_FILE"))

cred\_path=os.path.join(os.path.expanduser("~"), ".gcs", "credentials")

os.makedirs(os.path.dirname(cred\_path), exist\_ok=True)

withopen(cred\_path, "w") asf:

f.write(os.environ.get("GOOGLE\_APPLICATION\_CREDENTIALS\_FILE"))

os.environ\["GOOGLE\_APPLICATION\_CREDENTIALS"\] =cred\_path

workspace\_s3=boto3.client("s3")

pdf\_s3=boto3.client("s3")

\# Wait a little bit so that not all beaker jobs in a task start at the same time and download the model at the same time

replica\_count=int(os.environ.get("BEAKER\_REPLICA\_COUNT", "1"))

interval=10if (replica\_count-1) \*10<=30else30/max(1, replica\_count-1)

sleep\_time=int(os.environ.get("BEAKER\_REPLICA\_RANK", "0")) \*interval

logger.info(f"Beaker job sleeping for {sleep\_time} seconds to stagger model downloads")

awaitasyncio.sleep(sleep\_time)

\# If you specify an API key, meaning you are on a remote provider, then lower the group size default, not to overwhelm such servers

\# and not to waste money if a group doesn't finish right away

ifnothasattr(args, "pages\_per\_group"):

args.pages\_per\_group=50ifargs.api\_keyisnotNoneelse500

ifargs.workspace\_profile:

workspace\_session=boto3.Session(profile\_name=args.workspace\_profile)

workspace\_s3=workspace\_session.client("s3")

ifargs.pdf\_profile:

pdf\_session=boto3.Session(profile\_name=args.pdf\_profile)

pdf\_s3=pdf\_session.client("s3")

\# We need poppler to load the initial pdfs, even if we are not processing them here

check\_poppler\_version()

\# Create work queue

ifargs.workspace.startswith("s3://"):

work\_queue=WorkQueue(S3Backend(workspace\_s3, args.workspace))

else:

work\_queue=WorkQueue(LocalBackend(args.workspace))

ifargs.pdfs:

logger.info("Got --pdfs argument, going to add to the work queue")

pdf\_work\_paths=set()

tarball\_paths=set()

forpdf\_pathinargs.pdfs:

\# Expand s3 glob paths first, then categorize results

ifpdf\_path.startswith("s3://"):

logger.info(f"Expanding s3 glob at {pdf\_path}")

expanded\_paths=set(expand\_s3\_glob(pdf\_s3, pdf\_path))

tarball\_paths.update(pforpinexpanded\_pathsifis\_tarball\_path(p))

pdf\_work\_paths.update(pforpinexpanded\_pathsifnotis\_tarball\_path(p))

elifos.path.exists(pdf\_path):

\# Check if this is a tar.gz file (local)

ifis\_tarball\_path(pdf\_path):

tarball\_paths.add(pdf\_path)

elif (

pdf\_path.lower().endswith(".pdf")

orpdf\_path.lower().endswith(".png")

orpdf\_path.lower().endswith(".jpg")

orpdf\_path.lower().endswith(".jpeg")

):

ifopen(pdf\_path, "rb").read(4) ==b"%PDF":

logger.info(f"Loading file at {pdf\_path} as PDF document")

pdf\_work\_paths.add(pdf\_path)

elifis\_png(pdf\_path) oris\_jpeg(pdf\_path):

logger.info(f"Loading file at {pdf\_path} as image document")

pdf\_work\_paths.add(pdf\_path)

else:

logger.warning(f"File at {pdf\_path} is not a valid PDF")

elifpdf\_path.lower().endswith(".txt"):

logger.info(f"Loading file at {pdf\_path} as list of paths")

withopen(pdf\_path, "r") asf:

lines= \[line.strip() forlineinfifline.strip()\]

tarball\_paths.update(pforpinlinesifis\_tarball\_path(p))

pdf\_work\_paths.update(pforpinlinesifnotis\_tarball\_path(p))

else:

raiseValueError(f"Unsupported file extension for {pdf\_path}")

else:

raiseValueError("pdfs argument needs to be either a local path, an s3 path, or an s3 glob pattern...")

logger.info(f"Found {len(pdf\_work\_paths):,} regular pdf paths and {len(tarball\_paths):,} tarballs to add")

\# Process regular PDFs with calculated items\_per\_group

ifpdf\_work\_paths:

\# Estimate average pages per pdf

sample\_size=min(100, len(pdf\_work\_paths))

sampled\_pdfs=random.sample(list(pdf\_work\_paths), sample\_size)

page\_counts= \[\]

forpdfintqdm(sampled\_pdfs, desc="Sampling PDFs to calculate optimal length"):

try:

\# Download the PDF to a temp file

withtempfile.NamedTemporaryFile(suffix=".pdf") astmp\_file:

tmp\_file.write(get\_s3\_bytes(pdf\_s3, pdf))

tmp\_file.flush()

ifis\_png(tmp\_file.name) oris\_jpeg(tmp\_file.name):

page\_counts.append(1)

else:

reader=PdfReader(tmp\_file.name)

page\_counts.append(len(reader.pages))

exceptExceptionase:

logger.warning(f"Failed to read {pdf}: {e}")

ifpage\_counts:

avg\_pages\_per\_pdf=sum(page\_counts) /len(page\_counts)

else:

logger.warning("Could not read any PDFs to estimate average page count.")

avg\_pages\_per\_pdf=10\# Default to 10 pages per PDF if sampling fails

items\_per\_group=max(1, int(args.pages\_per\_group/avg\_pages\_per\_pdf))

logger.info(f"Calculated items\_per\_group: {items\_per\_group} based on average pages per PDF: {avg\_pages\_per\_pdf:.2f}")

\# Now call populate\_queue for regular PDFs

awaitwork\_queue.populate\_queue(list(pdf\_work\_paths), items\_per\_group)

\# Add tarballs to the queue - each tarball is one work item

iftarball\_paths:

awaitwork\_queue.populate\_queue(tarball\_paths, 1)

ifargs.stats:

print\_stats(args, work\_queue)

return

ifargs.beaker:

submit\_beaker\_job(args)

return

\# If you get this far, then you are doing inference and need a GPU

\# check\_sglang\_version()

ifuse\_internal\_server:

check\_torch\_gpu\_available()

logger.info(f"Starting pipeline with PID {os.getpid()}")

\# Download the model before you do anything else

ifuse\_internal\_server:

model\_name\_or\_path=awaitdownload\_model(args.model)

args.server=f"http://localhost:{args.port}/v1"

args.model="olmocr"\# Internal server always uses this name for the model, for supporting weird local model paths

logger.info(f"Using internal server at {args.server}")

else:

logger.info(f"Using external server at {args.server}")

model\_name\_or\_path=None

\# Initialize the work queue

qsize=awaitwork\_queue.initialize\_queue()

ifqsize==0:

logger.info("No work to do, exiting")

return

\# Start local vLLM instance if not using external one

vllm\_server=None

ifuse\_internal\_server:

vllm\_server=asyncio.create\_task(vllm\_server\_host(model\_name\_or\_path, args, unknown\_args))

awaitvllm\_server\_ready(args)

metrics\_task=asyncio.create\_task(metrics\_reporter(work\_queue))

\# Create worker tasks to process the queue concurrently.

worker\_tasks= \[\]

foriinrange(args.workers):

task=asyncio.create\_task(worker(args, work\_queue, worker\_id=i))

worker\_tasks.append(task)

\# Wait for all worker tasks to finish

awaitasyncio.gather(\*worker\_tasks)

\# Cancel vLLM server if it was started

ifvllm\_serverisnotNone:

vllm\_server.cancel()

metrics\_task.cancel()

\# Wait for cancelled tasks to complete

tasks\_to\_wait= \[metrics\_task\]

ifvllm\_serverisnotNone:

tasks\_to\_wait.append(vllm\_server)

awaitasyncio.gather(\*tasks\_to\_wait, return\_exceptions=True)

\# Output final metrics summary

metrics\_summary=metrics.get\_metrics\_summary()

logger.info("="\*80)

logger.info("FINAL METRICS SUMMARY")

logger.info("="\*80)

logger.info(f"Total elapsed time: {metrics\_summary\['elapsed\_time\_seconds'\]:.2f} seconds")

\# Output token counts and rates

total\_metrics=metrics\_summary\["total\_metrics"\]

rates=metrics\_summary\["rates"\]

logger.info(f"Total Server Input tokens: {total\_metrics.get('server\_input\_tokens', 0):,}")

logger.info(f"Total Server Output tokens: {total\_metrics.get('server\_output\_tokens', 0):,}")

logger.info(f"Finished input tokens: {total\_metrics.get('finished\_input\_tokens', 0):,}")

logger.info(f"Finished output tokens: {total\_metrics.get('finished\_output\_tokens', 0):,}")

logger.info(f"Completed pages: {total\_metrics.get('completed\_pages', 0):,}")

logger.info(f"Failed pages: {total\_metrics.get('failed\_pages', 0):,}")

logger.info(

f"Page Failure rate: {total\_metrics.get('failed\_pages', 0) /max(total\_metrics.get('completed\_pages', 0) +total\_metrics.get('failed\_pages', 0), 1) \*100:.2f}%"

)

\# Output finished\_on\_attempt statistics

logger.info("")

logger.info("Pages finished by attempt number:")

total\_finished=sum(total\_metrics.get(f"finished\_on\_attempt\_{i}", 0) foriinrange(args.max\_page\_retries))

cumulative=0

foriinrange(args.max\_page\_retries):

iff"finished\_on\_attempt\_{i}"intotal\_metrics:

count=total\_metrics\[f"finished\_on\_attempt\_{i}"\]

cumulative+=count

percentage= (count/total\_finished\*100) iftotal\_finished>0else0

cumulative\_percentage= (cumulative/total\_finished\*100) iftotal\_finished>0else0

logger.info(f" Attempt {i}: {count:,} pages ({percentage:.1f}%) \- Cumulative: {cumulative:,} ({cumulative\_percentage:.1f}%)")

\# Output rates

if"server\_input\_tokens\_per\_sec"inrates:

logger.info(f"Server Input tokens/sec rate: {rates\['server\_input\_tokens\_per\_sec'\]:.2f}")

if"server\_output\_tokens\_per\_sec"inrates:

logger.info(f"Server Output tokens/sec rate: {rates\['server\_output\_tokens\_per\_sec'\]:.2f}")

if"finished\_input\_tokens\_per\_sec"inrates:

logger.info(f"Finished Input tokens/sec rate: {rates\['finished\_input\_tokens\_per\_sec'\]:.2f}")

if"finished\_output\_tokens\_per\_sec"inrates:

logger.info(f"Finished Output tokens/sec rate: {rates\['finished\_output\_tokens\_per\_sec'\]:.2f}")

logger.info("="\*80)

logger.info("Work done")

defcli\_main():

"""Synchronous entry point for the CLI."""

returnasyncio.run(main())

if\_\_name\_\_=="\_\_main\_\_":

cli\_main()

You can’t perform that action at this time.