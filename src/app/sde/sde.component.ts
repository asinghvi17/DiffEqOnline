import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { ApiService } from '../api.service';
import { environment } from '../../environments/environment';
import { Router, ActivatedRoute, Params } from '@angular/router';

declare var Plotly: any;

@Component({
  selector: 'app-sde',
  templateUrl: './sde.component.html',
  styleUrls: ['./sde.component.css'],
  providers: [ApiService]
})
export class SdeComponent implements OnInit {

  constructor(
    private http: Http,
    private ApiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  private apiUrl = environment.apiBaseURL;
  private showAPIField = !environment.production;
  private serverAwake = false;
  private waitingOnServer = false;
  private serverError = '';

  // Initial values
  private settings = {
    diffEqText: 'dx = a*x - b*x*y\ndy = -c*y + d*x*y',
    noiseText: 'dx = 1\ndy = y',
    parameters: "a=1.5, b=1, c=3, d=1",
    noiseParameters: "a=2.5",
    timeSpan: [0.0, 10.0],
    initialConditions: "1.0, 1.0",
    solver: "Tsit5",
    vars: "[:x, :y]"
  };

  private model: any;

  private SDEsolvers = [
    {name: 'SRIW1' , desc: "Rossler's Strong Order 1.5 SRIW1 method"},
    {name: 'SRA1' , desc:  "Rossler's Strong Order 2.0 SRA1 method (for additive noise)"}
  ];

  private resultsObj: any;

  ngOnInit() {
    this.wakeUp();
    // var payload = this.route.snapshot.params['config'];
    // if (payload) {
    //   console.log('Payload is: ' + payload);
    //   try {
    //     this.config = JSON.parse(btoa(payload));
    //
    //   }
    // }


  }

  solve() {
    // Build a model to pass to the back end -- this is mostly the same as the settings object but with some tweaks to make it better understandable to the api
    this.model = Object.assign({}, {
      diffEqText: this.settings.diffEqText,
      noiseText: this.settings.noiseText,
      timeSpan: this.settings.timeSpan,
      parameters: this.settings.parameters.replace(/\s/g, '').split(','),
      noiseParameters: this.settings.noiseParameters.replace(/\s/g, '').split(','),
      initialConditions: this.settings.initialConditions.replace(/\s/g, '').split(','),
      vars: this.settings.vars,
      solver: this.settings.solver
    });
    console.log(this.model);
    this.waitingOnServer = true;
    this.sendDiffEq();
  }

  sendDiffEq() {
    return this.ApiService.passDiffEq(this.apiUrl, this.model).subscribe(
      data => this.resultsObj = data,
      error => this.handleServerError(error),
      () => this.plot()
    );
  }

  wakeUp() {
    return this.ApiService.wakeUp(this.apiUrl).subscribe(
      data => this.serverAwake = data.awake,
      error => this.serverError = error
    );
  }


  plot() {
    var self = this;
    self.waitingOnServer = false;
    console.log(self.resultsObj);
    var series = JSON.parse(this.resultsObj.series);
    var layout = JSON.parse(this.resultsObj.layout);
    layout.margin.b = 20;
    layout.margin.l = 20;
    console.log(layout);
    Plotly.newPlot('results-plot',series,layout);
  }

  serverErrorClose() {
    this.serverError='';
  }

  handleServerError(error) {
    this.waitingOnServer = false;
    this.serverError = error;
  }

}
