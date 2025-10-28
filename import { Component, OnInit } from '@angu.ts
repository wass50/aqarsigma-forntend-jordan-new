import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.css']
})
export class SearchBarComponent implements OnInit {
  makes: string[] = [];
  models: string[] = [];
  selectedMake: string = '';
  selectedModel: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<string[]>('http://localhost:8080/api/vehicles/makes')
      .subscribe(data => this.makes = data);
  }

  onMakeChange(make: string): void {
    this.selectedMake = make;
    this.selectedModel = '';
    this.models = [];
    if (make) {
      this.http.get<string[]>(`http://localhost:8080/api/vehicles/models?make=${make}`)
        .subscribe(data => this.models = data);
    }
  }
}